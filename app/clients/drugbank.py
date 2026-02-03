"""DrugBank-style client using free APIs (Open Targets, WikiPathways, DGIdb)

Since DrugBank requires a paid subscription, this client aggregates data from
free sources to provide similar drug-pathway information:
- Open Targets Platform (free) - drug-target-disease associations
- WikiPathways (free) - pathway data
- DGIdb (free) - drug-gene interactions
"""

import httpx
from typing import List, Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.config import settings
from app.models.schemas import PathwayMatch, ConfidenceTier
from app.services.cache import cache_service
from app.utils import fetch_concurrent

logger = logging.getLogger(__name__)


class DrugBankClient:
    """
    Client for fetching drug pathway data from free public APIs.
    Acts as a fallback when Reactome/ChEMBL don't have pathway data.
    """

    def __init__(self):
        self.open_targets_url = "https://api.platform.opentargets.org/api/v4/graphql"
        self.wikipathways_url = "https://webservice.wikipathways.org"
        self.dgidb_url = "https://dgidb.org/api/v2"
        self.timeout = 60.0

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2)
    )
    def _graphql_query(self, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        """Make GraphQL query to Open Targets"""
        logger.info(f"Open Targets GraphQL query")

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                self.open_targets_url,
                json={"query": query, "variables": variables},
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2)
    )
    def _get(self, url: str) -> Dict[str, Any]:
        """Make GET request"""
        logger.info(f"GET: {url}")

        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(url, headers={"Accept": "application/json"})
            response.raise_for_status()
            return response.json()

    def search_drug_by_name(self, drug_name: str) -> Optional[Dict[str, Any]]:
        """
        Search for a drug in Open Targets by name with caching.

        Args:
            drug_name: Drug/compound name

        Returns:
            Drug info dict with ID and name, or None
        """
        cache_key = drug_name.lower()
        cached = cache_service.get("open_targets_drug", cache_key)
        if cached:
            logger.debug(f"Cache hit for drug search: {drug_name}")
            return cached

        query = """
        query SearchDrug($queryString: String!) {
            search(queryString: $queryString, entityNames: ["drug"], page: {size: 5, index: 0}) {
                hits {
                    id
                    name
                    entity
                    description
                }
            }
        }
        """

        try:
            result = self._graphql_query(query, {"queryString": drug_name})
            hits = result.get("data", {}).get("search", {}).get("hits", [])

            if hits:
                # Find best match
                drug_name_lower = drug_name.lower()
                for hit in hits:
                    if hit.get("name", "").lower() == drug_name_lower:
                        cache_service.set("open_targets_drug", cache_key, hit)
                        return hit
                # Return first result if no exact match
                cache_service.set("open_targets_drug", cache_key, hits[0])
                return hits[0]

            return None

        except Exception as e:
            logger.error(f"Error searching Open Targets for {drug_name}: {e}")
            return None

    def get_drug_mechanisms(self, drug_id: str) -> List[Dict[str, Any]]:
        """
        Get drug mechanisms of action from Open Targets with caching.

        Args:
            drug_id: Open Targets drug ID (e.g., "CHEMBL521")

        Returns:
            List of mechanism dicts with target and action info
        """
        cached = cache_service.get("open_targets_mechanisms", drug_id)
        if cached:
            logger.debug(f"Cache hit for drug mechanisms: {drug_id}")
            return cached

        query = """
        query DrugMechanisms($chemblId: String!) {
            drug(chemblId: $chemblId) {
                id
                name
                mechanismsOfAction {
                    rows {
                        mechanismOfAction
                        targetName
                        targets {
                            id
                            approvedName
                        }
                        references {
                            source
                            ids
                            urls
                        }
                    }
                }
                indications {
                    rows {
                        disease {
                            id
                            name
                        }
                        maxPhaseForIndication
                    }
                }
            }
        }
        """

        try:
            result = self._graphql_query(query, {"chemblId": drug_id})
            drug_data = result.get("data", {}).get("drug", {})

            mechanisms = drug_data.get("mechanismsOfAction", {}).get("rows", [])
            cache_service.set("open_targets_mechanisms", drug_id, mechanisms)
            return mechanisms

        except Exception as e:
            logger.error(f"Error getting mechanisms for {drug_id}: {e}")
            return []

    def get_target_pathways(self, target_id: str) -> List[Dict[str, Any]]:
        """
        Get pathways associated with a target from Open Targets with caching.

        Args:
            target_id: Ensembl gene ID (e.g., "ENSG00000073756")

        Returns:
            List of pathway dicts
        """
        cached = cache_service.get("open_targets_pathways", target_id)
        if cached:
            logger.debug(f"Cache hit for target pathways: {target_id}")
            return cached

        query = """
        query TargetPathways($ensemblId: String!) {
            target(ensemblId: $ensemblId) {
                id
                approvedName
                pathways {
                    pathway
                    pathwayId
                    topLevelTerm
                }
            }
        }
        """

        try:
            result = self._graphql_query(query, {"ensemblId": target_id})
            target_data = result.get("data", {}).get("target", {})

            pathways = target_data.get("pathways", [])
            result_pathways = pathways if pathways else []
            cache_service.set("open_targets_pathways", target_id, result_pathways)
            return result_pathways

        except Exception as e:
            logger.error(f"Error getting pathways for {target_id}: {e}")
            return []

    def get_target_pathways_batch(self, target_ids: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get pathways for multiple targets with caching and concurrency.

        Args:
            target_ids: List of Ensembl gene IDs

        Returns:
            Dict mapping target_id -> list of pathways
        """
        results = {}

        if not target_ids:
            return results

        # Check cache
        cached = cache_service.get_many("open_targets_pathways", target_ids)
        results.update(cached)

        missing_ids = [tid for tid in target_ids if tid not in cached]

        if not missing_ids:
            logger.info(f"All {len(target_ids)} target pathways found in cache")
            return results

        logger.info(f"Target pathways - cache hit: {len(cached)}, fetching: {len(missing_ids)}")

        # Fetch missing concurrently (be gentle with Open Targets API)
        newly_fetched = fetch_concurrent(
            self.get_target_pathways,
            missing_ids,
            max_workers=3
        )

        results.update(newly_fetched)
        return results

    def get_pathways_for_drug(self, drug_name: str) -> List[PathwayMatch]:
        """
        Get pathway data for a drug by name with optimized batch fetching.
        This is the main entry point - use as fallback when Reactome has no data.

        Args:
            drug_name: Drug/compound name (e.g., "ibuprofen")

        Returns:
            List of PathwayMatch objects
        """
        try:
            # Step 1: Search for the drug (cached)
            drug_info = self.search_drug_by_name(drug_name)
            if not drug_info:
                logger.warning(f"Drug {drug_name} not found in Open Targets")
                return []

            drug_id = drug_info.get("id", "")
            logger.info(f"Found drug {drug_name} with ID {drug_id}")

            # Step 2: Get mechanisms of action (cached)
            mechanisms = self.get_drug_mechanisms(drug_id)

            # Step 3: Collect all unique target IDs first
            all_target_ids = set()
            target_id_to_name: Dict[str, str] = {}

            for mechanism in mechanisms:
                targets = mechanism.get("targets", [])
                for target in targets:
                    target_id = target.get("id", "")
                    target_name = target.get("approvedName", "")
                    if target_id:
                        all_target_ids.add(target_id)
                        target_id_to_name[target_id] = target_name

            # Step 4: Fetch all target pathways in batch (concurrent + cached)
            all_pathways = self.get_target_pathways_batch(list(all_target_ids))

            # Step 5: Aggregate pathways
            pathway_map: Dict[str, PathwayMatch] = {}

            for target_id, pathways in all_pathways.items():
                target_name = target_id_to_name.get(target_id, "")

                for pathway in pathways:
                    pathway_id = pathway.get("pathwayId", "")
                    pathway_name = pathway.get("pathway", "")

                    if not pathway_id or not pathway_name:
                        continue

                    if pathway_id not in pathway_map:
                        pathway_map[pathway_id] = PathwayMatch(
                            pathway_id=pathway_id,
                            pathway_name=pathway_name,
                            pathway_species="Homo sapiens",
                            matched_targets=[target_name] if target_name else [],
                            measured_targets_count=0,
                            predicted_targets_count=0,
                            impact_score=0.7,
                            confidence_tier=ConfidenceTier.TIER_B,
                            confidence_score=0.7,
                            explanation=f"Pathway linked via drug target {target_name} (Open Targets)",
                            pathway_url=f"https://reactome.org/content/detail/{pathway_id}"
                        )
                    else:
                        if target_name and target_name not in pathway_map[pathway_id].matched_targets:
                            pathway_map[pathway_id].matched_targets.append(target_name)

            pathways = list(pathway_map.values())
            logger.info(f"Found {len(pathways)} pathways for {drug_name} via Open Targets")

            return pathways

        except Exception as e:
            logger.error(f"Error getting pathways for drug {drug_name}: {e}")
            return []

    def get_drug_interactions(self, drug_name: str) -> List[Dict[str, Any]]:
        """
        Get drug-gene interactions from DGIdb.

        Args:
            drug_name: Drug name

        Returns:
            List of interaction dicts
        """
        try:
            url = f"{self.dgidb_url}/interactions.json?drugs={drug_name}"
            data = self._get(url)

            interactions = data.get("matchedTerms", [])
            result = []

            for term in interactions:
                drug_interactions = term.get("interactions", [])
                for interaction in drug_interactions:
                    result.append({
                        "drug": term.get("searchTerm"),
                        "gene": interaction.get("geneName"),
                        "interaction_type": interaction.get("interactionTypes", []),
                        "sources": interaction.get("sources", []),
                        "pmids": interaction.get("pmids", [])
                    })

            return result

        except Exception as e:
            logger.error(f"Error getting DGIdb interactions for {drug_name}: {e}")
            return []

    def get_wikipathways(self, gene_name: str) -> List[Dict[str, Any]]:
        """
        Get pathways from WikiPathways for a gene.

        Args:
            gene_name: Gene symbol (e.g., "PTGS2")

        Returns:
            List of pathway dicts
        """
        try:
            url = f"{self.wikipathways_url}/findPathwaysByXref?xref={gene_name}&species=Homo+sapiens&format=json"
            data = self._get(url)

            pathways = data.get("result", [])
            return pathways

        except Exception as e:
            logger.error(f"Error getting WikiPathways for {gene_name}: {e}")
            return []
