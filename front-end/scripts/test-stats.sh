#!/bin/bash

# Test Statistics Script
# Quick overview of test coverage and files

echo "========================================================================"
echo "📊 TEST STATISTICS - ClubManager Front-End"
echo "========================================================================"
echo ""

# Count test files
echo "📁 TEST FILES:"
echo "------------------------------------------------------------------------"

total_tests=$(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
test_ts=$(find src -name "*.test.ts" | wc -l)
test_tsx=$(find src -name "*.test.tsx" | wc -l)

echo "  Total test files:     $total_tests"
echo "  TypeScript (.test.ts):  $test_ts"
echo "  TSX (.test.tsx):        $test_tsx"
echo ""

# Count source files
echo "📄 SOURCE FILES:"
echo "------------------------------------------------------------------------"

total_src=$(find src -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v "/__tests__/" | wc -l)
src_ts=$(find src -name "*.ts" | grep -v ".test." | grep -v "/__tests__/" | wc -l)
src_tsx=$(find src -name "*.tsx" | grep -v ".test." | grep -v "/__tests__/" | wc -l)

echo "  Total source files:   $total_src"
echo "  TypeScript (.ts):     $src_ts"
echo "  TSX (.tsx):           $src_tsx"
echo ""

# Test coverage ratio
echo "📊 COVERAGE RATIO:"
echo "------------------------------------------------------------------------"

if [ $total_src -gt 0 ]; then
  ratio=$((total_tests * 100 / total_src))
  echo "  Test/Source ratio:    $ratio%"
  echo "  (Note: This is file ratio, not code coverage)"
else
  echo "  Unable to calculate ratio"
fi
echo ""

# By feature
echo "📦 TESTS BY FEATURE:"
echo "------------------------------------------------------------------------"

for feature in src/features/*/; do
  if [ -d "$feature" ]; then
    feature_name=$(basename "$feature")
    feature_tests=$(find "$feature" -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
    feature_src=$(find "$feature" -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v "/__tests__/" | wc -l)

    printf "  %-15s Tests: %4d  Source: %4d\n" "$feature_name" "$feature_tests" "$feature_src"
  fi
done
echo ""

# By type
echo "🔍 TESTS BY TYPE:"
echo "------------------------------------------------------------------------"

hooks_tests=$(find src -path "*/hooks/*" -name "*.test.ts" -o -path "*/hooks/*" -name "*.test.tsx" | wc -l)
components_tests=$(find src -path "*/components/*" -name "*.test.tsx" | wc -l)
services_tests=$(find src -path "*/services/*" -name "*.test.ts" | wc -l)
pages_tests=$(find src -path "*/pages/*" -name "*.test.tsx" | wc -l)
utils_tests=$(find src -path "*/utils/*" -name "*.test.ts" | wc -l)
store_tests=$(find src/store -name "*.test.ts" | wc -l)

echo "  Hooks:                $hooks_tests"
echo "  Components:           $components_tests"
echo "  Services:             $services_tests"
echo "  Pages:                $pages_tests"
echo "  Utils:                $utils_tests"
echo "  Store:                $store_tests"
echo ""

# Recent changes
echo "📅 RECENT TEST FILES:"
echo "------------------------------------------------------------------------"

echo "  Last 5 modified test files:"
find src -name "*.test.ts" -o -name "*.test.tsx" | xargs ls -lt | head -6 | tail -5 | awk '{print "    " $9}' | sed 's|src/||'
echo ""

# Summary
echo "========================================================================"
echo "✨ SUMMARY"
echo "========================================================================"
echo ""
echo "  Total Tests:          $total_tests files"
echo "  Total Source:         $total_src files"
echo "  File Ratio:           $ratio%"
echo ""

if [ $ratio -ge 80 ]; then
  echo "  Status:               🟢 Excellent coverage!"
elif [ $ratio -ge 60 ]; then
  echo "  Status:               🟡 Good progress, aim for 80%+"
elif [ $ratio -ge 40 ]; then
  echo "  Status:               🟠 Needs improvement"
else
  echo "  Status:               🔴 Low coverage, needs attention"
fi
echo ""
echo "  Run 'npm run test:coverage' for detailed coverage report"
echo ""
echo "========================================================================"
