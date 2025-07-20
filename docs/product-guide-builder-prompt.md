# Product Description Guide Builder - Web App Prompt

## Overview
Create a single HTML file that generates customized product description guides for any brand, following the Wild Donkey guide structure but adapting to each brand's unique details.

## Core Functionality
- Single page web app that collects brand information
- Integrates with Claude Opus API to generate customized guide
- Outputs a complete, downloadable guide following the proven framework
- Clean, professional interface with inline CSS

## Input Form Structure

### Section 1: Brand Basics
1. **Brand Name** (text input)
2. **Website URL** (url input)
3. **About Us URL** (url input) 
4. **Industry** (dropdown):
   - Fashion & Apparel
   - Home & Living
   - Beauty & Personal Care
   - Electronics & Tech
   - Food & Beverage
   - Sports & Outdoor
   - Toys & Kids
   - Pet Products
   - Other (with text field)

### Section 2: Brand Identity
5. **Unique Selling Proposition** (textarea)
   - Placeholder: "What makes your brand different? (e.g., 'Handcrafted in Italy with vintage-inspired designs')"
6. **Target Audience** (textarea)
   - Placeholder: "Describe your ideal customer (e.g., '25-40 year olds who appreciate authentic vintage Americana')"
7. **Brand Voice** (multiple select):
   - Professional
   - Friendly/Casual
   - Luxurious/Premium
   - Playful/Fun
   - Authentic/Honest
   - Technical/Expert
   - Nostalgic/Storytelling
8. **Key Competitors** (textarea)
   - Placeholder: "List 3-5 main competitors, one per line"

### Section 3: Product Information
9. **Main Product Categories** (textarea)
   - Placeholder: "List your main categories (e.g., T-Shirts, Hoodies, Jackets)"
10. **Example Product URLs** (textarea)
    - Placeholder: "Paste 2-3 product page URLs for reference"
11. **Current Product Description Example** (textarea)
    - Placeholder: "Paste one of your current product descriptions"

### Section 4: SEO Data
12. **Keyword Strategy CSV Upload** (file input)
    - Accept: .csv files
    - Should parse: Category, URL, Primary Keyword, Search Volume
13. **Geographic Target** (dropdown):
    - UK
    - US
    - Australia
    - Canada
    - Europe
    - Global

## Claude Opus API Integration

### API Configuration Section
Create a secure input field for users to enter their Claude API key. Store this in localStorage for convenience but ensure it's handled securely. Include a test button to verify the API key works before proceeding.

### API Call Structure
Implement an async function that:
- Builds the complete prompt using all collected brand data
- Makes a POST request to the Claude API endpoint
- Uses the claude-3-opus model for best results
- Sets appropriate headers including the API key and version
- Handles the response and displays the generated guide

## Master Prompt Template for Claude

The prompt builder function should construct a detailed request that includes:

**Opening instruction**: Create a comprehensive, beginner-friendly guide for writing SEO-optimized product descriptions for [brand name], a [industry] that sells [product categories].

**Brand context section** including:
- All collected URLs
- Their unique selling proposition
- Target audience description
- Selected brand voice attributes
- Competitor information
- Parsed keyword data from CSV
- Current product description example

**Strict structural requirements** that follow this exact format:

### 1. Introduction
- Explain what SEO product descriptions are (in simple terms)
- Use the stat that 75% of users never go past page 1 of Google
- Use the stat that 90% of shoppers rate product content as extremely important
- Make it clear why this matters for their specific business

### 2. The Process: 5 Simple Steps

#### Step 1: Know Your Customer
- Include a practical exercise with 4 specific questions
- Explain why this matters for SEO (using customer language)
- Provide 2-3 examples specific to their product types

#### Step 2: Research Your Product
- List "The Basics" (materials, dimensions, colors, care, origin)
- List "The Special Stuff" (unique features, story, customer favorites)
- Include a tip specific to their USP

#### Step 3: Find Your Keywords (Optional but Powerful)
- Explain keywords simply
- Show the progression: Basic → Better → Best
- Provide 4-5 product-specific examples
- List these exact free tools:
  - Google's "People also ask"
  - Answer the Public
  - Google Keyword Planner
- Include reminder to write for buyers, not bots

#### Step 4: Write Your Description
- Provide this exact structure:
  1. Opening Hook (1-2 sentences)
  2. Product Story (2-3 sentences)
  3. Key Benefits (3-5 bullet points)
  4. Practical Details (short paragraph)
  5. Call to Action

- Include these 4 writing techniques:
  - Use "You" Language
  - Focus on Benefits, Not Features (with example)
  - Use Sensory Words (with examples relevant to their products)
  - Tell a Mini-Story

- Provide one full example (250-300 words) using their actual product type

#### Step 5: Polish and Perfect
- List ways to make content scannable
- Include 4-point checklist for review
- List these 3 free tools:
  - Grammarly
  - Hemingway Editor
  - WordCounter

### 3. Action Plan
- Create an 8-point checklist specific to their brand
- Each point should be actionable and specific

### 4. Final Thoughts
- Reference the dual purpose (inform and persuade)
- Connect to their specific USP
- End with "Start with one product. Use this guide. See the difference. Then do another."

**Style requirements**:
- Write at 8th-grade reading level
- Use conversational tone
- Include specific examples throughout
- Avoid marketing jargon
- No icons or special characters
- Keep paragraphs to 2-3 sentences max
- Bold important concepts

## UI/UX Design

### Layout Structure
Create a split-screen design with:
- Left panel (400px wide on desktop): Input form
- Right panel: Output preview and results
- Mobile responsive: Stack panels vertically on screens under 768px

### Input Panel Design
- Light gray background (#f9fafb)
- 2rem padding
- Scrollable for long forms
- Right border to separate from output

### Output Panel Design
- White background
- 2rem padding
- Scrollable content area
- Clear typography for reading

### Form Styling
All inputs should have:
- Full width within their container
- 0.75rem padding
- Light gray border (#e5e7eb)
- 6px border radius
- 16px font size for accessibility

Labels should be:
- Block display
- 0.5rem bottom margin
- Medium font weight (500)
- Dark gray color (#374151)

### Section Organization
Each form section should:
- Have 2rem bottom margin
- Include 2rem bottom padding
- Display a bottom border
- Feature clear section headings

### Button Design
Primary action button should have:
- Blue background (#2563eb)
- White text
- 0.75rem vertical, 2rem horizontal padding
- 6px border radius
- Hover state with darker blue (#1d4ed8)

### Progress Indicator
Create a visual progress bar showing:
- 4 steps (one for each form section)
- Gray background for incomplete steps
- Blue fill for completed steps
- Smooth transitions between states

## Output Features

### Generated Guide Options
Provide four output methods:
1. **Preview in Browser** - Styled HTML preview in the right panel
2. **Download as Markdown** - Clean .md file for editing
3. **Download as PDF** - Print-ready formatted version
4. **Copy to Clipboard** - Quick sharing functionality

### Guide Customization
The generated guide should include:
- Introduction with their specific industry context
- All 5 steps with examples using their actual products
- Action plan tailored to their brand
- Industry-specific tips based on their selection
- Integration of their keyword opportunities throughout

## Advanced Features

### CSV Parser Functionality
Implement a file reader that:
- Accepts CSV file uploads
- Parses headers to identify columns
- Extracts category names, URLs, keywords, and search volumes
- Handles common CSV formats and delimiters
- Displays parsed data for user verification

### Smart Suggestions System
Create helper functions that:
- Analyze current product descriptions for voice indicators
- Suggest appropriate brand voice selections
- Identify keyword opportunities from CSV data
- Recommend priority categories based on search volume

### Save & Load System
Implement local storage features to:
- Auto-save form progress every 30 seconds
- Allow users to save multiple brand configurations
- Export configurations as JSON files
- Import previously saved configurations
- Include timestamps for version control

## Error Handling

### Form Validation
Check for:
- All required fields are filled
- Valid URL formats
- Minimum character counts for text areas
- Valid CSV file format
- API key presence

### API Error Management
Handle these scenarios:
- Invalid API key (401 error)
- Rate limiting (429 error)
- Server errors (500 error)
- Network connectivity issues
- Timeout after 30 seconds

Display user-friendly error messages for each scenario with clear next steps.

### Fallback Options
If API fails, provide:
- Option to retry with same data
- Ability to download form data for later use
- Basic template they can customize manually
- Contact information for support

## Visual Polish

### Professional Design Elements
- Clean typography using system fonts
- Generous whitespace for readability
- Subtle shadows for depth
- Smooth transitions (0.2s) for all interactions
- Loading spinner during API calls

### Interactive Features
- Tooltips on hover for complex fields
- Collapsible sections for better organization
- Real-time character counts for text areas
- Visual feedback for completed sections
- Success animations when guide is generated

### Accessibility
- All form fields properly labeled
- Keyboard navigation support
- ARIA labels for screen readers
- High contrast ratios for text
- Focus indicators on all interactive elements

## Final Application Flow

1. **Welcome State**: Brief explanation of the tool's purpose
2. **Input Collection**: User fills out all four form sections
3. **Validation**: Check all required fields are complete
4. **API Call**: Send data to Claude with loading indicator
5. **Preview**: Display generated guide in output panel
6. **Export Options**: Offer all download/share methods
7. **Save Option**: Allow saving configuration for future use

The final application should feel professional, be easy to use, and generate high-quality guides that genuinely help brands improve their product descriptions.