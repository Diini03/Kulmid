

## Plan: Phone Number CSV Export for SMS Marketing

### Overview
Add a feature for event creators to export registered attendees' phone numbers as a CSV file directly from the Event Management Overview page. This helps creators who use services like Hormuud to send SMS notifications to their guests.

---

### Why This Helps

Many event organizers in Somalia use:
- **Hormuud SMS** - Local carrier for bulk messaging
- **Google Forms** - To collect attendee data, then export for SMS

With this feature, your platform replaces Google Forms entirely:
1. Attendees register through Kulmid
2. Creator downloads phone numbers as CSV
3. Upload CSV to Hormuud portal → Send SMS to all attendees

---

### Implementation

#### Location: Event Overview Tab
Add an "Export Contacts" section in the Guests card on the Overview page (`EventBuilderOverview.tsx`).

```text
+------------------------------------------+
|  GUESTS                          [Invite] |
+------------------------------------------+
|                                          |
|  [123]        [89]         [45]          |
|  Confirmed    Pending      Checked In    |
|                                          |
|  ─────────────────────────────────────   |
|                                          |
|  📥 Export Contacts                      |
|  ┌──────────────────────────────────┐    |
|  │  [📱] Download Phone Numbers     │    |  <- New CSV export button
|  │       45 contacts with phone     │    |
|  │                                  │    |
|  │  [📧] Download All Contacts      │    |  <- Optional: Full export
|  │       123 total registrations    │    |
|  └──────────────────────────────────┘    |
|                                          |
+------------------------------------------+
```

---

### CSV Export Format

**Phone Numbers CSV** (`event-phones-{eventId}.csv`):
```csv
name,phone_number,status
Ahmed Mohamed,+252612345678,confirmed
Fatima Hassan,+252617654321,confirmed
```

**Full Contacts CSV** (optional, for email campaigns):
```csv
name,email,phone_number,organization,status,registered_at
Ahmed Mohamed,ahmed@email.com,+252612345678,Tech Corp,confirmed,2024-01-15
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/csvParser.ts` | Add `generateGuestPhoneCSV()` and `generateGuestContactsCSV()` functions |
| `src/components/events/EventBuilderOverview.tsx` | Add Export Contacts section with download buttons |

---

### Technical Implementation

#### 1. New CSV Generator Functions (`src/lib/csvParser.ts`)

```typescript
export interface GuestExportData {
  name: string | null;
  email: string;
  phone_number: string | null;
  organization: string | null;
  status: string;
  created_at: string;
}

// Export phone numbers only (for SMS marketing)
export const generateGuestPhoneCSV = (
  guests: GuestExportData[], 
  eventTitle: string
): void => {
  // Filter guests with phone numbers
  const withPhones = guests.filter(g => g.phone_number);
  
  // Build CSV content
  const headers = ['name', 'phone_number', 'status'];
  const rows = withPhones.map(g => [
    g.name || 'Guest',
    g.phone_number,
    g.status
  ]);
  
  // Generate and download
  const csvContent = [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
  
  downloadCSV(csvContent, `phone-numbers-${sanitize(eventTitle)}.csv`);
};

// Export all contact details (for email + phone campaigns)
export const generateGuestContactsCSV = (
  guests: GuestExportData[], 
  eventTitle: string
): void => {
  const headers = ['name', 'email', 'phone_number', 'organization', 'status', 'registered_at'];
  const rows = guests.map(g => [
    g.name || 'Guest',
    g.email,
    g.phone_number || '',
    g.organization || '',
    g.status,
    new Date(g.created_at).toLocaleDateString()
  ]);
  
  const csvContent = [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
  
  downloadCSV(csvContent, `contacts-${sanitize(eventTitle)}.csv`);
};
```

#### 2. Overview Page Updates (`EventBuilderOverview.tsx`)

Add to existing guests data fetch:
```typescript
// In fetchGuestData()
const { data: guests } = await supabase
  .from("event_guests")
  .select("id, name, email, phone_number, organization, status, created_at, checked_in")
  .eq("event_id", event.id);

// Store full guest data for export
setGuestsForExport(guests);

// Calculate phone count
const phoneCount = guests.filter(g => g.phone_number).length;
```

Add Export section in UI:
```typescript
{/* Export Contacts Section */}
<div className="border-t border-border pt-4 mt-4">
  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
    Export Contacts
  </div>
  <div className="space-y-2">
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start"
      onClick={handleExportPhones}
      disabled={phoneCount === 0}
    >
      <Phone className="h-4 w-4 mr-2" />
      Download Phone Numbers
      <span className="ml-auto text-xs text-muted-foreground">
        {phoneCount} contacts
      </span>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={handleExportAllContacts}
    >
      <Download className="h-4 w-4 mr-2" />
      Download All Contacts
      <span className="ml-auto text-xs text-muted-foreground">
        {guestStats.total} total
      </span>
    </Button>
  </div>
</div>
```

---

### Edge Cases Handled

| Case | Behavior |
|------|----------|
| No phone numbers | Button disabled, shows "0 contacts" |
| Empty names | Falls back to "Guest" in CSV |
| Special characters in names | Wrapped in quotes for CSV safety |
| Large datasets | Uses standard browser download (no server processing) |

---

### Summary

This feature adds:

1. **Phone Numbers CSV Export** - Download only guests with phone numbers (for Hormuud SMS)
2. **All Contacts CSV Export** - Download full contact list (name, email, phone, org)
3. **Smart counts** - Shows how many guests have phone numbers before downloading
4. **Easy access** - Export buttons directly in Overview tab (most visited)

The CSV format is compatible with Hormuud and other bulk SMS services used in Somalia.

