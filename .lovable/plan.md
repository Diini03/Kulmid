
## Plan: CSV Import for Guest Invitations

### Overview
Add the ability to import multiple email addresses from a CSV file when inviting guests to events, matching the functionality shown in Luma's invite dialog.

---

### How It Will Work

1. **User Experience Flow**
   - User opens the "Invite Guests" dialog
   - They see the existing manual email input
   - Below it, there's a new "Import CSV" section with a dashed border drop zone
   - User can drag-and-drop a CSV file or click to browse
   - The system reads the CSV, finds the "email" column, and extracts all valid emails
   - Emails are added to the existing email list (with duplicate filtering)
   - A "Download CSV Template" link is provided for users who need guidance

2. **CSV Parsing Logic**
   - Accept files with `.csv` extension
   - Parse the CSV looking for a column header named "email" (case-insensitive)
   - Extract all valid email addresses from that column
   - Skip empty rows and invalid email formats
   - Handle common CSV edge cases (quoted values, different delimiters)

3. **User Feedback**
   - Show count of successfully imported emails
   - Show warnings for invalid emails (skipped)
   - Show error if "email" column not found
   - Show error if file is not a valid CSV

---

### Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `papaparse` dependency for robust CSV parsing |
| `src/components/events/InviteGuestsDialog.tsx` | Modify | Add CSV import UI and logic |
| `src/lib/csvParser.ts` | Create | Utility for parsing CSV and extracting emails |

---

### UI Design (Matching Kulmid Style)

The CSV import section will be added below the manual email input:

```text
+------------------------------------------+
| Email Addresses                          |
| [guest@example.com          ] [Add]      |
| Press Enter or click Add after each email|
|                                          |
| [badge] [badge] [badge] ...              |
+------------------------------------------+
|                                          |
| Import CSV                               |
| +--------------------------------------+ |
| |        [CSV Icon]                    | |
| |    Import CSV File                   | |
| |  Drop file or click here to choose   | |
| +--------------------------------------+ |
| Download CSV Template                    |
+------------------------------------------+
```

**Styling Details:**
- Dashed border on the drop zone (`border-dashed border-2`)
- Muted text for instructions
- File icon from Lucide React (`FileSpreadsheet`)
- Hover state with slightly darker background
- Active/drag state with primary color border

---

### Technical Implementation

**1. Add Papaparse Dependency**

Papaparse is a fast, reliable CSV parser that handles edge cases like:
- Different line endings (Windows/Mac/Linux)
- Quoted fields with commas inside
- Empty rows
- Header detection

**2. New CSV Parser Utility (`src/lib/csvParser.ts`)**

```typescript
interface ParseResult {
  emails: string[];
  skippedCount: number;
  error?: string;
}

function parseEmailsFromCSV(file: File): Promise<ParseResult>
```

This function will:
- Read the file using FileReader
- Parse with papaparse (header: true)
- Find the "email" column (case-insensitive search)
- Validate each email format
- Return valid emails and count of skipped invalid ones

**3. Update InviteGuestsDialog.tsx**

Add state for:
- `isDragging` - for drag-and-drop visual feedback
- `isProcessingCSV` - loading state during parse

Add functions:
- `handleFileDrop(e: DragEvent)` - handle drag and drop
- `handleFileSelect(e: ChangeEvent<HTMLInputElement>)` - handle file picker
- `processCSVFile(file: File)` - parse and add emails
- `downloadTemplate()` - generate sample CSV template

Add UI elements:
- Hidden file input with `accept=".csv"`
- Drop zone div with click-to-browse
- File icon and instructions
- Download template link

---

### CSV Template

When user clicks "Download CSV Template", generate a simple CSV:

```csv
email,name
guest1@example.com,Guest Name
guest2@example.com,Another Guest
```

Note: Only the "email" column is required; "name" is optional and ignored.

---

### Validation and Error Handling

| Scenario | User Feedback |
|----------|---------------|
| No "email" column found | Toast: "Could not find 'email' column in CSV. Please check your file format." |
| Empty file | Toast: "The CSV file appears to be empty" |
| All emails invalid | Toast: "No valid email addresses found in the CSV" |
| Some invalid emails | Toast: "Imported X emails, skipped Y invalid entries" |
| Duplicate emails | Silently filtered (same as manual entry) |
| File read error | Toast: "Failed to read file. Please try again." |

---

### Edge Cases Handled

1. **Column name variations**: Matches "email", "Email", "EMAIL", "e-mail", "E-Mail"
2. **Extra whitespace**: Trims emails before validation
3. **Duplicates in CSV**: Removed before adding to list
4. **Duplicates with existing**: Existing emails in the list are preserved, duplicates not re-added
5. **Mixed valid/invalid**: Valid emails imported, invalid ones counted and reported
6. **Large files**: Papaparse handles chunked parsing efficiently

---

### Summary

This feature adds a Luma-style CSV import to the guest invitation dialog:
- Drop zone for drag-and-drop or click-to-browse
- Automatic "email" column detection
- Robust parsing with proper error handling
- Sample template download
- Seamless integration with existing email list
