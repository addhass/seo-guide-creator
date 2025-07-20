# TSV/CSV Column Structure Analysis

## Current Issue
The code expects columns named "Keyword" and "Search Volume", but the actual TSV files have different column names.

## File Analysis Results

### 1. Wild Donkey TSV File (Examples/Wild Donkey - Keyword Strategy - RAW Keyword Data.tsv)
**Columns Found:**
- Page ID
- Topic
- Page Type
- **Keyword** ✓ (Column index 3)
- Meta Title
- Meta Description
- H1
- H2
- URL
- **Search Volume (MSV)** ✗ (Column index 9 - Different name than expected)
- Keyword Difficulty (KD)
- CPC (Cost Per Click)
- Search Intent
- Current Position

**Issue:** The code looks for "Search Volume" but the file has "Search Volume (MSV)"

### 2. Sample Keywords TSV (sample-keywords.tsv)
**Columns Found:**
- **Keyword** ✓
- **Search Volume** ✓
- Keyword Difficulty
- CPC
- Competition

**Status:** This file matches the expected format perfectly

### 3. Test Keywords CSV (test-keywords.csv)
**Columns Found:**
- **Keyword** ✓
- **Search Volume** ✓

**Status:** This file matches the expected format perfectly

### 4. Test Keywords Simple TSV (test-keywords-simple.tsv)
**Columns Found:**
- **Keyword** ✓
- **Search Volume** ✓

**Status:** This file matches the expected format perfectly

## Code Expectations

In `/server/cors-proxy-server.js` (lines 1196-1202), the code looks for:
```javascript
const keywordIndex = header.findIndex(col => {
    const normalized = col.toLowerCase().trim();
    return normalized === 'keyword' || normalized === 'primary keyword';
});
const searchVolumeIndex = header.findIndex(col => {
    const normalized = col.toLowerCase();
    return normalized.includes('search volume') || normalized.includes('msv');
});
```

## Solution
The code already handles "msv" in the search, so it should work with "Search Volume (MSV)". The issue might be:
1. Case sensitivity in the comparison
2. Extra whitespace or special characters
3. The parentheses in "(MSV)" might be causing issues

## Recommended Fix
The code should be more flexible in matching column names:
- "Search Volume", "Search Volume (MSV)", "MSV", "Monthly Search Volume"
- Handle various case combinations
- Trim whitespace properly
- Handle special characters like parentheses