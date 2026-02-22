#!/bin/bash

# Render Compatibility Test Script
# Run this to verify your application is Render-ready

echo "🔍 RENDER COMPATIBILITY TEST SUITE"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Test function
run_test() {
    local test_name=$1
    local command=$2
    local expected_pattern=$3

    test_count=$((test_count + 1))
    echo -n "Test $test_count: $test_name... "

    result=$(eval "$command" 2>&1)

    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASS${NC}"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected pattern: $expected_pattern"
        echo "  Got: $result"
        fail_count=$((fail_count + 1))
    fi
}

# Tests
echo "📋 CHECKING FILE STRUCTURE"
echo ""

run_test "Dockerfile exists at root" \
    "test -f Dockerfile && echo 'found'" \
    "found"

run_test "Dockerfile has PORT variable" \
    "grep -n 'PORT' Dockerfile" \
    "PORT"

run_test "Dockerfile has health check" \
    "grep -n 'HEALTHCHECK' Dockerfile" \
    "HEALTHCHECK"

echo ""
echo "📦 CHECKING PYTHON SYNTAX"
echo ""

run_test "main.py syntax" \
    "python3 -m py_compile backend/app/main.py 2>&1 && echo 'OK'" \
    "OK"

run_test "config.py syntax" \
    "python3 -m py_compile backend/app/config.py 2>&1 && echo 'OK'" \
    "OK"

run_test "celery_tasks.py syntax" \
    "python3 -m py_compile backend/app/tasks/celery_tasks.py 2>&1 && echo 'OK'" \
    "OK"

echo ""
echo "🔧 CHECKING CONFIGURATION"
echo ""

run_test "Celery uses in-memory broker" \
    "grep 'celery_broker_url' backend/app/config.py" \
    "memory://"

run_test "Cache uses /tmp directory" \
    "grep 'disk_cache_dir' backend/app/config.py" \
    "/tmp"

run_test "Models use /tmp directory" \
    "grep 'deeplearning_model_path' backend/app/config.py" \
    "/tmp"

run_test "Redis disabled by default" \
    "grep 'redis_enabled' backend/app/config.py" \
    "False"

echo ""
echo "📝 CHECKING CODE ROBUSTNESS"
echo ""

run_test "deepchem_ml_service has try/except" \
    "grep -A 2 'from app.services.deepchem_ml_service' backend/app/main.py" \
    "except"

run_test "numpy has try/except wrapper" \
    "grep -A 1 'import numpy' backend/app/services/deepchem_ml_service.py" \
    "except"

run_test "Cache has fallback handling" \
    "grep -A 5 'try:' backend/app/services/cache.py | head -10" \
    "except"

echo ""
echo "🔌 CHECKING ENDPOINTS"
echo ""

run_test "Health endpoint exists" \
    "grep -n '@app.get.*health' backend/app/main.py" \
    "health"

run_test "API info endpoint exists" \
    "grep -n '@app.get.*api' backend/app/main.py" \
    "/api"

echo ""
echo "=================================="
echo "📊 TEST RESULTS"
echo "=================================="
echo "Total: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}🟢 ALL TESTS PASSED${NC}"
    echo "Your application is ready for Render deployment!"
    exit 0
else
    echo -e "${RED}🔴 SOME TESTS FAILED${NC}"
    echo "Please fix the issues above before deploying."
    exit 1
fi
