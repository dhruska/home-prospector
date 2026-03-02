export interface GeocodedCoords {
  lat: number;
  lng: number;
}

export interface Property extends Record<string, unknown> {
  Id?: number;
  Address?: string;
  City?: string;
  State?: string;
  Zip?: string | number;
  County?: string;
  "Living Square Feet"?: number;
  "Year Built"?: number;
  "Lot (Acres)"?: number;
  Bedrooms?: number;
  Bathrooms?: number;
  "# of Stories"?: number;
  "Land Use"?: string;
  "Property Type"?: string;
  "Owner 1 First Name"?: string;
  "Owner 1 Last Name"?: string;
  "Owner 2 First Name"?: string;
  "Owner 2 Last Name"?: string;
  "Owner Mailing Address"?: string;
  "Owner Mailing City"?: string;
  "Owner Mailing State"?: string;
  "Owner Mailing Zip"?: string | number;
  "Ownership Length (Months)"?: number;
  "Owner Type"?: string;
  "Owner Occupied"?: number | string;
  "Listing Status"?: string;
  "Listing Price"?: number;
  "Last Sale Date"?: string;
  "Last Sale Amount"?: number;
  "Estimated Value"?: number;
  "Estimated Equity"?: number;
  "Estimated Equity Percent"?: number;
  "Open Mortgage Balance"?: number;
  "Recorded Mortgage Interest Rate"?: number;
  "Tax Amount"?: number;
  "Assessed Total Value"?: number;
  "Market Value"?: number;
  coords?: GeocodedCoords;
}
