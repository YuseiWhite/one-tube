#!/bin/bash

# OneTube Package Check Script
# Usage: ./check-packages.sh [lint|typecheck|build|test|all]
# Compatible with Bash 3.x (macOS default)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root (dynamically determine)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Define packages (Bash 3.x compatible - no associative arrays)
PACKAGE_NAMES=("contracts" "app")
PACKAGE_PATHS=("contracts" "app")

# Results tracking (format: "name:result|name:result|...")
LINT_RESULTS=""
TYPECHECK_RESULTS=""
BUILD_RESULTS=""
TEST_RESULTS=""

# Function to get package path by name
get_package_path() {
    local name="$1"
    local i=0
    for pkg_name in "${PACKAGE_NAMES[@]}"; do
        if [ "$pkg_name" = "$name" ]; then
            echo "${PACKAGE_PATHS[$i]}"
            return 0
        fi
        i=$((i + 1))
    done
    echo ""
}

# Function to store result
store_result() {
    local check_type="$1"
    local package_name="$2"
    local result="$3"

    local entry="${package_name}:${result}"

    case $check_type in
        "lint")
            if [ -z "$LINT_RESULTS" ]; then
                LINT_RESULTS="$entry"
            else
                LINT_RESULTS="${LINT_RESULTS}|${entry}"
            fi
            ;;
        "typecheck")
            if [ -z "$TYPECHECK_RESULTS" ]; then
                TYPECHECK_RESULTS="$entry"
            else
                TYPECHECK_RESULTS="${TYPECHECK_RESULTS}|${entry}"
            fi
            ;;
        "build")
            if [ -z "$BUILD_RESULTS" ]; then
                BUILD_RESULTS="$entry"
            else
                BUILD_RESULTS="${BUILD_RESULTS}|${entry}"
            fi
            ;;
        "test")
            if [ -z "$TEST_RESULTS" ]; then
                TEST_RESULTS="$entry"
            else
                TEST_RESULTS="${TEST_RESULTS}|${entry}"
            fi
            ;;
    esac
}

# Function to get result
get_result() {
    local check_type="$1"
    local package_name="$2"
    local results=""

    case $check_type in
        "lint") results="$LINT_RESULTS" ;;
        "typecheck") results="$TYPECHECK_RESULTS" ;;
        "build") results="$BUILD_RESULTS" ;;
        "test") results="$TEST_RESULTS" ;;
    esac

    echo "$results" | tr '|' '\n' | grep "^${package_name}:" | cut -d':' -f2
}

# Function to print section header
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Function to print package header
print_package_header() {
    echo -e "\n${YELLOW}--- $1 ---${NC}"
}

# Function to check if script exists in package.json
has_script() {
    local package_path="$1"
    local script_name="$2"

    if [ -f "$package_path/package.json" ]; then
        grep -q "\"$script_name\":" "$package_path/package.json" 2>/dev/null
    else
        return 1
    fi
}

# Function to check if Move.toml exists (for contracts)
has_move_toml() {
    local package_path="$1"
    [ -f "$package_path/Move.toml" ]
}

# Function to run command and capture result
run_check() {
    local package_name="$1"
    local package_path="$2"
    local command="$3"
    local check_type="$4"

    print_package_header "$package_name ($check_type)"
    echo "Path: $package_path"
    echo "Command: cd $package_path && $command"
    echo ""

    # Check if timeout command exists (not available on macOS by default)
    if command -v timeout >/dev/null 2>&1; then
        # Use timeout if available
        if cd "$package_path" && timeout 120 $command; then
            echo -e "${GREEN}✅ $check_type PASSED${NC}"
            store_result "$check_type" "$package_name" "PASS"
        else
            echo -e "${RED}❌ $check_type FAILED${NC}"
            store_result "$check_type" "$package_name" "FAIL"
        fi
    else
        # Run without timeout on macOS
        if cd "$package_path" && $command; then
            echo -e "${GREEN}✅ $check_type PASSED${NC}"
            store_result "$check_type" "$package_name" "PASS"
        else
            echo -e "${RED}❌ $check_type FAILED${NC}"
            store_result "$check_type" "$package_name" "FAIL"
        fi
    fi

    cd "$PROJECT_ROOT"
}

# Function to run lint checks
run_lint_checks() {
    print_header "LINT CHECKS"

    for package_name in "${PACKAGE_NAMES[@]}"; do
        package_path=$(get_package_path "$package_name")

        if [ "$package_name" = "contracts" ]; then
            # Move contracts don't have lint in the traditional sense
            echo -e "${YELLOW}⚠️  $package_name: Skipping (Move contract)${NC}"
            store_result "lint" "$package_name" "SKIP"
        elif has_script "$package_path" "lint"; then
            run_check "$package_name" "$package_path" "pnpm run lint" "lint"
        else
            # Try biome directly
            if [ -f "$PROJECT_ROOT/node_modules/.bin/biome" ]; then
                run_check "$package_name" "$package_path" "pnpm exec biome check ." "lint"
            else
                echo -e "${YELLOW}⚠️  $package_name: No lint script found${NC}"
                store_result "lint" "$package_name" "SKIP"
            fi
        fi
    done
}

# Function to run typecheck
run_typecheck() {
    print_header "TYPESCRIPT CHECKS"

    for package_name in "${PACKAGE_NAMES[@]}"; do
        package_path=$(get_package_path "$package_name")

        if [ "$package_name" = "contracts" ]; then
            # Move contracts don't use TypeScript
            echo -e "${YELLOW}⚠️  $package_name: Skipping (Move contract)${NC}"
            store_result "typecheck" "$package_name" "SKIP"
        elif has_script "$package_path" "typecheck"; then
            run_check "$package_name" "$package_path" "pnpm run typecheck" "typecheck"
        else
            # Try tsc directly
            if [ -f "$package_path/tsconfig.json" ]; then
                run_check "$package_name" "$package_path" "pnpm exec tsc --noEmit" "typecheck"
            else
                echo -e "${YELLOW}⚠️  $package_name: No typecheck script found${NC}"
                store_result "typecheck" "$package_name" "SKIP"
            fi
        fi
    done
}

# Function to run build checks
run_build_checks() {
    print_header "BUILD CHECKS"

    for package_name in "${PACKAGE_NAMES[@]}"; do
        package_path=$(get_package_path "$package_name")

        if [ "$package_name" = "contracts" ]; then
            # Use sui move build for contracts
            if has_move_toml "$package_path"; then
                run_check "$package_name" "$package_path" "sui move build" "build"
            else
                echo -e "${YELLOW}⚠️  $package_name: No Move.toml found${NC}"
                store_result "build" "$package_name" "SKIP"
            fi
        elif has_script "$package_path" "build"; then
            run_check "$package_name" "$package_path" "pnpm run build" "build"
        else
            echo -e "${YELLOW}⚠️  $package_name: No build script found${NC}"
            store_result "build" "$package_name" "SKIP"
        fi
    done
}

# Function to run test checks
run_test_checks() {
    print_header "TEST CHECKS"

    for package_name in "${PACKAGE_NAMES[@]}"; do
        package_path=$(get_package_path "$package_name")

        if [ "$package_name" = "contracts" ]; then
            # Use sui move test for contracts
            if has_move_toml "$package_path"; then
                run_check "$package_name" "$package_path" "sui move test" "test"
            else
                echo -e "${YELLOW}⚠️  $package_name: No Move.toml found${NC}"
                store_result "test" "$package_name" "SKIP"
            fi
        elif has_script "$package_path" "test"; then
            run_check "$package_name" "$package_path" "pnpm run test" "test"
        else
            echo -e "${YELLOW}⚠️  $package_name: No test script found${NC}"
            store_result "test" "$package_name" "SKIP"
        fi
    done
}

# Function to count results by type
count_results() {
    local results="$1"
    local result_type="$2"

    if [ -z "$results" ]; then
        echo "0"
        return
    fi

    # Use grep without -c to avoid non-zero exit code, then count with wc -l
    local count
    count=$(echo "$results" | tr '|' '\n' | grep ":${result_type}$" | wc -l | tr -d ' ')

    if [ -z "$count" ]; then
        echo "0"
    else
        echo "$count"
    fi
}

# Function to print summary
print_summary() {
    print_header "SUMMARY"

    # Print individual results
    if [ -n "$LINT_RESULTS" ]; then
        echo -e "\n${BLUE}Lint Results:${NC}"
        for package_name in "${PACKAGE_NAMES[@]}"; do
            result=$(get_result "lint" "$package_name")
            case $result in
                "PASS") echo -e "  ${GREEN}✅ $package_name${NC}" ;;
                "FAIL") echo -e "  ${RED}❌ $package_name${NC}" ;;
                "SKIP") echo -e "  ${YELLOW}⚠️  $package_name (skipped)${NC}" ;;
            esac
        done
    fi

    if [ -n "$TYPECHECK_RESULTS" ]; then
        echo -e "\n${BLUE}TypeCheck Results:${NC}"
        for package_name in "${PACKAGE_NAMES[@]}"; do
            result=$(get_result "typecheck" "$package_name")
            case $result in
                "PASS") echo -e "  ${GREEN}✅ $package_name${NC}" ;;
                "FAIL") echo -e "  ${RED}❌ $package_name${NC}" ;;
                "SKIP") echo -e "  ${YELLOW}⚠️  $package_name (skipped)${NC}" ;;
            esac
        done
    fi

    if [ -n "$BUILD_RESULTS" ]; then
        echo -e "\n${BLUE}Build Results:${NC}"
        for package_name in "${PACKAGE_NAMES[@]}"; do
            result=$(get_result "build" "$package_name")
            case $result in
                "PASS") echo -e "  ${GREEN}✅ $package_name${NC}" ;;
                "FAIL") echo -e "  ${RED}❌ $package_name${NC}" ;;
                "SKIP") echo -e "  ${YELLOW}⚠️  $package_name (skipped)${NC}" ;;
            esac
        done
    fi

    if [ -n "$TEST_RESULTS" ]; then
        echo -e "\n${BLUE}Test Results:${NC}"
        for package_name in "${PACKAGE_NAMES[@]}"; do
            result=$(get_result "test" "$package_name")
            case $result in
                "PASS") echo -e "  ${GREEN}✅ $package_name${NC}" ;;
                "FAIL") echo -e "  ${RED}❌ $package_name${NC}" ;;
                "SKIP") echo -e "  ${YELLOW}⚠️  $package_name (skipped)${NC}" ;;
            esac
        done
    fi

    # Count results
    local total_packages=${#PACKAGE_NAMES[@]}
    local lint_pass
    local lint_fail
    local typecheck_pass
    local typecheck_fail
    local build_pass
    local build_fail
    local test_pass
    local test_fail

    lint_pass=$(count_results "$LINT_RESULTS" "PASS" | tr -d '\n')
    lint_fail=$(count_results "$LINT_RESULTS" "FAIL" | tr -d '\n')
    typecheck_pass=$(count_results "$TYPECHECK_RESULTS" "PASS" | tr -d '\n')
    typecheck_fail=$(count_results "$TYPECHECK_RESULTS" "FAIL" | tr -d '\n')
    build_pass=$(count_results "$BUILD_RESULTS" "PASS" | tr -d '\n')
    build_fail=$(count_results "$BUILD_RESULTS" "FAIL" | tr -d '\n')
    test_pass=$(count_results "$TEST_RESULTS" "PASS" | tr -d '\n')
    test_fail=$(count_results "$TEST_RESULTS" "FAIL" | tr -d '\n')

    echo -e "\n${BLUE}Overall Status:${NC}"
    echo "Total Packages: $total_packages"

    if [ -n "$LINT_RESULTS" ]; then
        echo "Lint: ${lint_pass} passed, ${lint_fail} failed"
    fi
    if [ -n "$TYPECHECK_RESULTS" ]; then
        echo "TypeCheck: ${typecheck_pass} passed, ${typecheck_fail} failed"
    fi
    if [ -n "$BUILD_RESULTS" ]; then
        echo "Build: ${build_pass} passed, ${build_fail} failed"
    fi
    if [ -n "$TEST_RESULTS" ]; then
        echo "Test: ${test_pass} passed, ${test_fail} failed"
    fi

    # Exit with error if any checks failed
    local total_fail=$((lint_fail + typecheck_fail + build_fail + test_fail))
    if [ "$total_fail" -gt 0 ]; then
        echo -e "\n${RED}❌ Some checks failed!${NC}"
        exit 1
    else
        echo -e "\n${GREEN}✅ All checks passed!${NC}"
    fi
}

# Main execution
main() {
    local command="${1:-all}"

    echo -e "${BLUE}OneTube Package Checker${NC}"
    echo "Project Root: $PROJECT_ROOT"
    echo "Command: $command"
    echo "Total Packages: ${#PACKAGE_NAMES[@]}"

    case $command in
        "lint")
            run_lint_checks
            ;;
        "typecheck")
            run_typecheck
            ;;
        "build")
            run_build_checks
            ;;
        "test")
            run_test_checks
            ;;
        "all")
            run_lint_checks
            run_typecheck
            run_build_checks
            run_test_checks
            ;;
        *)
            echo "Usage: $0 [lint|typecheck|build|test|all]"
            echo ""
            echo "Commands:"
            echo "  lint      - Run lint checks on all packages"
            echo "  typecheck - Run TypeScript type checks on all packages"
            echo "  build     - Run build checks on all packages"
            echo "  test      - Run tests on all packages"
            echo "  all       - Run all checks (default)"
            exit 1
            ;;
    esac

    print_summary
}

# Run main function with all arguments
main "$@"
