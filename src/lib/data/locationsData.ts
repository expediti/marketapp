export interface StateLocationInfo {
  state: string;
  cities: string[];
}

export const INDIAN_STATES_AND_CITIES: Record<string, string[]> = {
  'Uttar Pradesh': [
    'Varanasi',
    'Lucknow',
    'Noida',
    'Kanpur',
    'Prayagraj',
    'Agra',
    'Ghaziabad',
    'Gorakhpur',
    'Meerut',
    'Bareilly',
  ],
  'Maharashtra': [
    'Mumbai',
    'Pune',
    'Nagpur',
    'Nashik',
    'Thane',
    'Aurangabad',
    'Navi Mumbai',
    'Kolhapur',
  ],
  'Karnataka': [
    'Bengaluru',
    'Mysuru',
    'Hubli',
    'Mangaluru',
    'Belagavi',
    'Shivamogga',
  ],
  'Delhi NCR': [
    'Delhi NCR',
    'New Delhi',
    'Gurugram',
    'Noida',
    'Faridabad',
    'Ghaziabad',
  ],
  'Rajasthan': [
    'Jaipur',
    'Jodhpur',
    'Udaipur',
    'Kota',
    'Ajmer',
    'Bikaner',
  ],
  'Kerala': [
    'Kochi',
    'Thiruvananthapuram',
    'Kozhikode',
    'Thrissur',
    'Kollam',
  ],
  'Telangana': [
    'Hyderabad',
    'Warangal',
    'Nizamabad',
    'Karimnagar',
  ],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
  ],
  'Gujarat': [
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Bhavnagar',
  ],
  'West Bengal': [
    'Kolkata',
    'Siliguri',
    'Howrah',
    'Durgapur',
    'Asansol',
  ],
  'Punjab': [
    'Chandigarh',
    'Ludhiana',
    'Amritsar',
    'Jalandhar',
    'Patiala',
  ],
  'Madhya Pradesh': [
    'Indore',
    'Bhopal',
    'Gwalior',
    'Jabalpur',
    'Ujjain',
  ],
  'Bihar': [
    'Patna',
    'Gaya',
    'Muzaffarpur',
    'Bhagalpur',
  ],
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Tirupati',
  ],
  'Odisha': [
    'Bhubaneswar',
    'Cuttack',
    'Rourkela',
    'Puri',
  ],
  'Assam': [
    'Guwahati',
    'Silchar',
    'Dibrugarh',
  ],
  'Goa': [
    'Panaji',
    'Margao',
    'Vasco da Gama',
  ],
  'Uttarakhand': [
    'Dehradun',
    'Haridwar',
    'Rishikesh',
  ],
  'Himachal Pradesh': [
    'Shimla',
    'Dharamshala',
    'Manali',
  ],
};

export const POPULAR_INDIAN_CITIES = [
  'Varanasi',
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Jaipur',
  'Kochi',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Chennai',
  'Ahmedabad',
  'Chandigarh',
  'Lucknow',
  'Indore',
];

export function getAllIndianStates(): string[] {
  return Object.keys(INDIAN_STATES_AND_CITIES);
}

export function getCitiesForIndianState(state: string): string[] {
  return INDIAN_STATES_AND_CITIES[state] || [];
}

export function getAllIndianCities(): string[] {
  const all = new Set<string>();
  Object.values(INDIAN_STATES_AND_CITIES).forEach((cities) => {
    cities.forEach((c) => all.add(c));
  });
  return Array.from(all).sort();
}

export function findStateForCity(city: string): string | null {
  const normalized = city.trim().toLowerCase();
  for (const [state, cities] of Object.entries(INDIAN_STATES_AND_CITIES)) {
    if (cities.some((c) => c.toLowerCase() === normalized)) {
      return state;
    }
  }
  return null;
}
