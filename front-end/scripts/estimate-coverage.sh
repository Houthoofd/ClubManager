#!/bin/bash

# Coverage Estimation Script
# Provides quick coverage estimation without running tests

echo "========================================================================"
echo "📊 COVERAGE ESTIMATION - ClubManager Front-End"
echo "========================================================================"
echo ""

# Count files
total_source=$(find src -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v "/__tests__/" | grep -v "/node_modules/" | wc -l)
total_tests=$(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l)

# Exclude certain files from coverage calculation
excludable_source=$(find src/core/api/apollo/generated -name "*.ts" 2>/dev/null | wc -l)
adjusted_source=$((total_source - excludable_source))

echo "📁 FILE COUNTS:"
echo "------------------------------------------------------------------------"
echo "  Total source files:        $total_source"
echo "  Large generated files:     $excludable_source (excluded from estimate)"
echo "  Adjusted source files:     $adjusted_source"
echo "  Test files:                $total_tests"
echo ""

# Calculate ratio
if [ $adjusted_source -gt 0 ]; then
  ratio=$((total_tests * 100 / adjusted_source))
  echo "  Test/Source ratio:         $ratio%"
else
  ratio=0
  echo "  Test/Source ratio:         Unable to calculate"
fi
echo ""

# Estimate coverage based on ratio and file distribution
echo "📈 COVERAGE ESTIMATION:"
echo "------------------------------------------------------------------------"

# Base estimation on ratio
if [ $ratio -ge 130 ]; then
  min_coverage=75
  max_coverage=85
elif [ $ratio -ge 100 ]; then
  min_coverage=65
  max_coverage=75
elif [ $ratio -ge 80 ]; then
  min_coverage=55
  max_coverage=65
elif [ $ratio -ge 60 ]; then
  min_coverage=45
  max_coverage=55
else
  min_coverage=30
  max_coverage=40
fi

echo "  Estimated coverage:        $min_coverage% - $max_coverage%"
echo "  Based on $ratio% file ratio"
echo ""

# Check coverage by category
echo "📦 COVERAGE BY CATEGORY:"
echo "------------------------------------------------------------------------"

categories=("features" "core" "shared" "store")
for cat in "${categories[@]}"; do
  if [ -d "src/$cat" ]; then
    cat_source=$(find src/$cat -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v "/__tests__/" | wc -l)
    cat_tests=$(find src/$cat -name "*.test.ts" -o -name "*.test.tsx" | wc -l)

    if [ $cat_source -gt 0 ]; then
      cat_ratio=$((cat_tests * 100 / cat_source))
      printf "  %-15s Source: %4d  Tests: %4d  Ratio: %3d%%\n" "$cat" "$cat_source" "$cat_tests" "$cat_ratio"
    fi
  fi
done
echo ""

# Check untested files
echo "🔍 UNTESTED FILES ANALYSIS:"
echo "------------------------------------------------------------------------"

untested_count=0
untested_list=""

# Find source files without corresponding test files
while IFS= read -r source_file; do
  # Remove src/ prefix and extension
  file_path="${source_file#src/}"
  file_base="${file_path%.ts}"
  file_base="${file_base%.tsx}"

  # Skip index files and type definitions
  if [[ "$file_base" == *"/index" ]] || [[ "$file_base" == *.d ]]; then
    continue
  fi

  # Check if test file exists
  test_file1="src/${file_base}.test.ts"
  test_file2="src/${file_base}.test.tsx"

  if [ ! -f "$test_file1" ] && [ ! -f "$test_file2" ]; then
    untested_count=$((untested_count + 1))
    if [ $untested_count -le 10 ]; then
      untested_list="${untested_list}    - $file_path\n"
    fi
  fi
done < <(find src -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v "/__tests__/" | grep -v "/generated/" | head -100)

echo "  Untested files found:      $untested_count"
if [ $untested_count -gt 0 ] && [ $untested_count -le 10 ]; then
  echo ""
  echo "  First untested files:"
  echo -e "$untested_list"
elif [ $untested_count -gt 10 ]; then
  echo ""
  echo "  First 10 untested files:"
  echo -e "$untested_list"
  echo "    ... and $((untested_count - 10)) more"
fi
echo ""

# Overall assessment
echo "========================================================================"
echo "✨ OVERALL ASSESSMENT"
echo "========================================================================"
echo ""
echo "  Total Test Files:          $total_tests"
echo "  Total Source Files:        $adjusted_source (adjusted)"
echo "  File Coverage Ratio:       $ratio%"
echo ""
echo "  Estimated Code Coverage:   $min_coverage% - $max_coverage%"
echo ""

if [ $min_coverage -ge 80 ]; then
  echo "  Status:                    🟢 EXCELLENT - Target 80% reached!"
  echo "  Recommendation:            Maintain and improve test quality"
elif [ $min_coverage -ge 70 ]; then
  echo "  Status:                    🟢 GOOD - Close to 80% target"
  echo "  Recommendation:            Add $((80 - min_coverage))% more to reach 80%"
elif [ $min_coverage -ge 60 ]; then
  echo "  Status:                    🟡 MODERATE - Significant progress"
  echo "  Recommendation:            Focus on untested critical modules"
elif [ $min_coverage -ge 40 ]; then
  echo "  Status:                    🟠 LOW - Needs improvement"
  echo "  Recommendation:            Generate more tests for core modules"
else
  echo "  Status:                    🔴 VERY LOW - Urgent action needed"
  echo "  Recommendation:            Start systematic test generation"
fi
echo ""

echo "  To measure real coverage:"
echo "    npm run test:coverage"
echo ""
echo "========================================================================"
