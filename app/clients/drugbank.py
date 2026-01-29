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
        Search for a drug in Open Targets by name.

        Args:
            drug_name: Drug/compound name

        Returns:
            Drug info dict with ID and name, or None
        """
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
                        return hit
                # Return first result if no exact match
                return hits[0]

            return None

        except Exception as e:
            logger.error(f"Error searching Open Targets for {drug_name}: {e}")
            return None

    def get_drug_mechanisms(self, drug_id: str) -> List[Dict[str, Any]]:
        """
        Get drug mechanisms of action from Open Targets.

        Args:
            drug_id: Open Targets drug ID (e.g., "CHEMBL521")

        Returns:
            List of mechanism dicts with target and action info
        """
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
            return mechanisms

        except Exception as e:
            logger.error(f"Error getting mechanisms for {drug_id}: {e}")
            return []

    def get_target_pathways(self, target_id: str) -> List[Dict[str, Any]]:
        """
        Get pathways associated with a target from Open Targets.

        Args:
            target_id: Ensembl gene ID (e.g., "ENSG00000073756")

        Returns:
            List of pathway dicts
        """
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
            return pathways if pathways else []

        except Exception as e:
            logger.error(f"Error getting pathways for {target_id}: {e}")
            return []

    def get_pathways_for_drug(self, drug_name: str) -> List[PathwayMatch]:
        """
        Get pathway data for a drug by name.
        This is the main entry point - use as fallback when Reactome has no data.

        Args:
            drug_name: Drug/compound name (e.g., "ibuprofen")

        Returns:
            List of PathwayMatch objects
        """
        try:
            # Step 1: Search for the drug
            drug_info = self.search_drug_by_name(drug_name)
            if not drug_info:
                logger.warning(f"Drug {drug_name} not found in Open Targets")
                return []

            drug_id = drug_info.get("id", "")
            logger.info(f"Found drug {drug_name} with ID {drug_id}")

            # Step 2: Get mechanisms of action
            mechanisms = self.get_drug_mechanisms(drug_id)

            # Step 3: Collect unique pathways from all targets
            pathway_map: Dict[str, PathwayMatch] = {}

            for mechanism in mechanisms:
                targets = mechanism.get("targets", [])
                mechanism_action = mechanism.get("mechanismOfAction", "Unknown mechanism")

                for target in targets:
                    target_id = target.get("id", "")
                    target_name = target.get("approvedName", "")

                    if not target_id:
                        continue

                    # Get pathways for this target
                    pathways = self.get_target_pathways(target_id)

                    for pathway in pathways:
                        pathway_id = pathway.get("pathwayId", "")
                        pathway_name = pathway.get("pathway", "")

                        if not pathway_id or not pathway_name:
                            continue

                        # Create or update pathway match
                        if pathway_id not in pathway_map:
                            pathway_map[pathway_id] = PathwayMatch(
                                pathway_id=pathway_id,
                                pathway_name=pathway_name,
                                pathway_source="Reactome",  # Open Targets uses Reactome pathway IDs
                                matched_targets=[target_name] if target_name else [],
                                confidence_tier=ConfidenceTier.TIER_B,
                                confidence_score=0.7,
                                url=f"https://reactome.org/content/detail/{pathway_id}"
                            )
                        else:
                            # Add target to existing pathway
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
