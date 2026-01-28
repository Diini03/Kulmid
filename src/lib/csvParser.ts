import Papa from 'papaparse';

export interface CSVParseResult {
  emails: string[];
  skippedCount: number;
  error?: string;
}

const EMAIL_COLUMN_VARIANTS = ['email', 'e-mail', 'emails', 'e-mails', 'email address', 'emailaddress'];

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const findEmailColumn = (headers: string[]): string | null => {
  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    if (EMAIL_COLUMN_VARIANTS.includes(normalizedHeader)) {
      return header;
    }
  }
  return null;
};

export const parseEmailsFromCSV = (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      resolve({
        emails: [],
        skippedCount: 0,
        error: 'Please upload a CSV file',
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          resolve({
            emails: [],
            skippedCount: 0,
            error: 'The CSV file appears to be empty',
          });
          return;
        }

        const headers = results.meta.fields || [];
        const emailColumn = findEmailColumn(headers);

        if (!emailColumn) {
          resolve({
            emails: [],
            skippedCount: 0,
            error: "Could not find 'email' column in CSV. Please check your file format.",
          });
          return;
        }

        const validEmails: string[] = [];
        let skippedCount = 0;

        for (const row of results.data as Record<string, string>[]) {
          const emailValue = row[emailColumn];
          if (emailValue) {
            const email = emailValue.trim().toLowerCase();
            if (isValidEmail(email)) {
              if (!validEmails.includes(email)) {
                validEmails.push(email);
              }
            } else {
              skippedCount++;
            }
          }
        }

        if (validEmails.length === 0 && skippedCount > 0) {
          resolve({
            emails: [],
            skippedCount,
            error: 'No valid email addresses found in the CSV',
          });
          return;
        }

        resolve({
          emails: validEmails,
          skippedCount,
        });
      },
      error: (error) => {
        resolve({
          emails: [],
          skippedCount: 0,
          error: `Failed to read file: ${error.message}`,
        });
      },
    });
  });
};

export const generateCSVTemplate = (): void => {
  const csvContent = 'email,name\nguest1@example.com,Guest Name\nguest2@example.com,Another Guest\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'guest-emails-template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============= Guest Export Functions =============

export interface GuestExportData {
  name: string | null;
  email: string;
  phone_number: string | null;
  organization: string | null;
  status: string;
  created_at: string;
}

const sanitizeFilename = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
};

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeCSVCell = (cell: string): string => {
  // Escape quotes by doubling them and wrap in quotes if needed
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
};

/**
 * Export phone numbers only (for SMS marketing via Hormuud etc.)
 */
export const generateGuestPhoneCSV = (
  guests: GuestExportData[], 
  eventTitle: string
): void => {
  // Filter guests with phone numbers
  const withPhones = guests.filter(g => g.phone_number);
  
  if (withPhones.length === 0) {
    return;
  }

  // Build CSV content
  const headers = ['name', 'phone_number', 'status'];
  const rows = withPhones.map(g => [
    escapeCSVCell(g.name || 'Guest'),
    escapeCSVCell(g.phone_number || ''),
    escapeCSVCell(g.status)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  downloadCSV(csvContent, `phone-numbers-${sanitizeFilename(eventTitle)}.csv`);
};

/**
 * Export all contact details (for email + phone campaigns)
 */
export const generateGuestContactsCSV = (
  guests: GuestExportData[], 
  eventTitle: string
): void => {
  if (guests.length === 0) {
    return;
  }

  const headers = ['name', 'email', 'phone_number', 'organization', 'status', 'registered_at'];
  const rows = guests.map(g => [
    escapeCSVCell(g.name || 'Guest'),
    escapeCSVCell(g.email),
    escapeCSVCell(g.phone_number || ''),
    escapeCSVCell(g.organization || ''),
    escapeCSVCell(g.status),
    escapeCSVCell(new Date(g.created_at).toLocaleDateString())
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  downloadCSV(csvContent, `contacts-${sanitizeFilename(eventTitle)}.csv`);
};
