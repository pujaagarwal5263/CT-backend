class CSVValidator {
  // Column header mapping
  static columnMapping = {
    'Reference Code': 'order_id',
    'Order ID': 'order_id',
    'AWB No': 'awb_number',
    'Order Date': 'order_date',
    'Client Location': 'warehouse',
    'Courier': 'courier',
    'Client': 'client',
    'SKU': 'sku',
    'Quantity': 'quantity',
    'Order Status': 'order_status',
    'Shipping Status': 'shipping_status',
    'TAT': 'tat',
    'Manifested At': 'manifested_at',
    'Delivered At': 'delivered_at'
  };

  // Map row columns to standard field names
  static mapRowColumns(row) {
    const mappedRow = {};
    for (const [key, value] of Object.entries(row)) {
      const mappedKey = this.columnMapping[key] || key.toLowerCase().replace(/ /g, '_');
      // Trim whitespace and remove special characters like backticks
      const cleanValue = value ? value.toString().trim().replace(/^`+|`+$/g, '') : value;
      mappedRow[mappedKey] = cleanValue;
    }
    return mappedRow;
  }

  // Convert DD-MM-YYYY HH:MM to YYYY-MM-DD HH:MM:SS
  static convertDateFormat(dateStr) {
    if (!dateStr) return null;
    // Trim whitespace
    dateStr = dateStr.trim();
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr;
    }
    // Convert DD-MM-YYYY HH:MM to YYYY-MM-DD HH:MM:SS
    const parts = dateStr.split(' ');
    if (parts.length >= 1) {
      const dateParts = parts[0].trim().split('-');
      if (dateParts.length === 3) {
        const convertedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        // Add time if present
        if (parts.length >= 2) {
          return `${convertedDate} ${parts[1].trim()}:00`;
        }
        return convertedDate;
      }
    }
    return dateStr;
  }

  static validateRow(row, rowIndex) {
    const errors = [];
    const warnings = [];

    // Map columns
    const mappedRow = this.mapRowColumns(row);

    // Check mandatory fields (awb_number is optional)
    const mandatoryFields = ['order_id', 'order_date', 'warehouse', 'courier'];
    
    mandatoryFields.forEach(field => {
      if (!mappedRow[field] || mappedRow[field].trim() === '') {
        errors.push(`Row ${rowIndex}: Missing mandatory field '${field}'`);
      }
    });

    // Validate and convert date format
    if (mappedRow.order_date) {
      const trimmedDate = mappedRow.order_date.trim();
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/; // DD-MM-YYYY format
      const dateTimeRegex = /^\d{2}-\d{2}-\d{4} \d{1,2}:\d{2}$/; // DD-MM-YYYY H:MM or HH:MM format
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}/; // YYYY-MM-DD format
      
      if (!dateRegex.test(trimmedDate) && !dateTimeRegex.test(trimmedDate) && !isoDateRegex.test(trimmedDate)) {
        errors.push(`Row ${rowIndex}: Invalid date format for order_date: "${mappedRow.order_date}". Expected DD-MM-YYYY or DD-MM-YYYY HH:MM`);
      }
      // Update the mapped value with trimmed version
      mappedRow.order_date = trimmedDate;
    }

    // Validate quantity is numeric
    if (mappedRow.quantity && isNaN(parseInt(mappedRow.quantity))) {
      errors.push(`Row ${rowIndex}: Quantity must be numeric`);
    }

    return { errors, warnings, isValid: errors.length === 0, mappedRow };
  }

  static detectDuplicates(rows) {
    const seen = new Set();
    const duplicates = [];
    const firstOccurrences = new Set(); // Track first occurrence of each order_id

    rows.forEach((row, index) => {
      const mappedRow = this.mapRowColumns(row);
      // Use order_id as the unique identifier
      const key = mappedRow.order_id;
      
      if (seen.has(key)) {
        duplicates.push({
          rowIndex: index + 1,
          order_id: mappedRow.order_id,
          awb_number: mappedRow.awb_number
        });
      } else {
        firstOccurrences.add(key); // Mark first occurrence
        seen.add(key);
      }
    });

    return { duplicates, firstOccurrences };
  }

  static validateFile(rows) {
    const validationResults = {
      validRows: [],
      invalidRows: [],
      duplicateRows: [],
      errors: [],
      warnings: []
    };

    // Check for duplicates within file
    const { duplicates, firstOccurrences } = this.detectDuplicates(rows);
    validationResults.duplicateRows = duplicates;

    console.log(`Duplicate detection: Found ${duplicates.length} duplicates`);
    console.log(`First occurrences: ${firstOccurrences.size} unique orders`);

    if (duplicates.length > 0) {
      validationResults.warnings.push(
        `Found ${duplicates.length} duplicate rows within the file (based on Order ID)`
      );
      console.log('Duplicate rows:', duplicates);
    }

    // Validate each row
    rows.forEach((row, index) => {
      const validation = this.validateRow(row, index + 1);
      
      if (validation.isValid) {
        // Only add if it's the first occurrence of this order_id
        if (firstOccurrences.has(validation.mappedRow.order_id)) {
          firstOccurrences.delete(validation.mappedRow.order_id); // Remove so only first occurrence is added
          validation.mappedRow.order_date = this.convertDateFormat(validation.mappedRow.order_date);
          validationResults.validRows.push(validation.mappedRow);
        } else {
          console.log(`Row ${index + 1} marked as duplicate: ${validation.mappedRow.order_id}`);
        }
      } else {
        validationResults.invalidRows.push({
          rowIndex: index + 1,
          row,
          errors: validation.errors
        });
        validationResults.errors.push(...validation.errors);
      }
    });

    console.log(`Validation summary: Total=${rows.length}, Valid=${validationResults.validRows.length}, Invalid=${validationResults.invalidRows.length}, Duplicates=${duplicates.length}`);

    return validationResults;
  }
}

module.exports = CSVValidator;
