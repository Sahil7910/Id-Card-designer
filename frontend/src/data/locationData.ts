// ── Location Data — India (all 28 states + major UTs) ─────────────
// Used for cascading Country → State → District → City dropdowns.
// Pincode is auto-filled when a city is selected.
// Countries other than India have hasLocationData: false and use free-text inputs.

export interface CityData {
  name:    string;
  pincode: string;
}

export interface DistrictData {
  name:   string;
  cities: CityData[];
}

export interface StateData {
  name:      string;
  districts: DistrictData[];
}

export interface CountryData {
  name:            string;
  hasLocationData: boolean;
  states:          StateData[];
}

// ── India State Data ────────────────────────────────────────────────
const INDIA_STATES: StateData[] = [
  {
    name: "Andhra Pradesh",
    districts: [
      { name: "Visakhapatnam", cities: [{ name: "Visakhapatnam City", pincode: "530001" }, { name: "Gajuwaka", pincode: "530026" }, { name: "Madhurawada", pincode: "530048" }] },
      { name: "Vijayawada",    cities: [{ name: "Vijayawada City",    pincode: "520001" }, { name: "Benz Circle",   pincode: "520008" }, { name: "Governorpet",    pincode: "520002" }] },
      { name: "Tirupati",      cities: [{ name: "Tirupati City",      pincode: "517501" }, { name: "Balaji Nagar",  pincode: "517502" }] },
    ],
  },
  {
    name: "Arunachal Pradesh",
    districts: [
      { name: "Itanagar", cities: [{ name: "Itanagar City", pincode: "791111" }, { name: "Naharlagun", pincode: "791110" }] },
      { name: "Tawang",   cities: [{ name: "Tawang Town",   pincode: "790104" }] },
    ],
  },
  {
    name: "Assam",
    districts: [
      { name: "Guwahati",  cities: [{ name: "Dispur",       pincode: "781006" }, { name: "Paltan Bazar",  pincode: "781008" }, { name: "Chandmari",      pincode: "781003" }] },
      { name: "Dibrugarh", cities: [{ name: "Dibrugarh City", pincode: "786001" }, { name: "Lahowal",      pincode: "786010" }] },
      { name: "Silchar",   cities: [{ name: "Silchar City",   pincode: "788001" }, { name: "Meherpur",     pincode: "788006" }] },
    ],
  },
  {
    name: "Bihar",
    districts: [
      { name: "Patna",   cities: [{ name: "Patna City",    pincode: "800001" }, { name: "Boring Road",   pincode: "800001" }, { name: "Bailey Road",    pincode: "800001" }, { name: "Kankarbagh",    pincode: "800020" }] },
      { name: "Gaya",    cities: [{ name: "Gaya City",     pincode: "823001" }, { name: "Bodh Gaya",     pincode: "824231" }] },
      { name: "Muzaffarpur", cities: [{ name: "Muzaffarpur City", pincode: "842001" }, { name: "Brahampura",    pincode: "842003" }] },
    ],
  },
  {
    name: "Chhattisgarh",
    districts: [
      { name: "Raipur",    cities: [{ name: "Raipur City",    pincode: "492001" }, { name: "Shankar Nagar",  pincode: "492007" }, { name: "Telibandha",     pincode: "492006" }] },
      { name: "Bilaspur",  cities: [{ name: "Bilaspur City",  pincode: "495001" }, { name: "Torwa",          pincode: "495004" }] },
    ],
  },
  {
    name: "Goa",
    districts: [
      { name: "North Goa", cities: [{ name: "Panaji",    pincode: "403001" }, { name: "Mapusa",     pincode: "403507" }, { name: "Calangute",  pincode: "403516" }] },
      { name: "South Goa", cities: [{ name: "Margao",    pincode: "403601" }, { name: "Vasco",      pincode: "403802" }] },
    ],
  },
  {
    name: "Gujarat",
    districts: [
      {
        name: "Ahmedabad",
        cities: [
          { name: "Navrangpura",  pincode: "380009" }, { name: "Satellite",    pincode: "380015" },
          { name: "Bopal",        pincode: "380058" }, { name: "Maninagar",    pincode: "380008" },
          { name: "Vastrapur",    pincode: "380015" }, { name: "Prahlad Nagar", pincode: "380015" },
          { name: "Ghatlodia",    pincode: "380061" }, { name: "Naroda",        pincode: "382330" },
        ],
      },
      {
        name: "Surat",
        cities: [
          { name: "Adajan",      pincode: "395009" }, { name: "Athwalines",   pincode: "395001" },
          { name: "Katargam",    pincode: "395004" }, { name: "Vesu",         pincode: "395007" },
          { name: "Udhna",       pincode: "394210" },
        ],
      },
      {
        name: "Vadodara",
        cities: [
          { name: "Alkapuri",    pincode: "390005" }, { name: "Gotri",        pincode: "390021" },
          { name: "Manjalpur",   pincode: "390011" }, { name: "Akota",        pincode: "390020" },
        ],
      },
      {
        name: "Rajkot",
        cities: [
          { name: "Rajkot City",  pincode: "360001" }, { name: "Kalawad Road", pincode: "360005" },
          { name: "Raiya Road",   pincode: "360007" },
        ],
      },
    ],
  },
  {
    name: "Haryana",
    districts: [
      { name: "Gurugram",  cities: [{ name: "DLF City",       pincode: "122002" }, { name: "Sector 14",      pincode: "122001" }, { name: "Sohna Road",     pincode: "122018" }] },
      { name: "Faridabad", cities: [{ name: "NIT Faridabad",   pincode: "121001" }, { name: "Sector 21C",     pincode: "121001" }] },
      { name: "Ambala",    cities: [{ name: "Ambala City",     pincode: "134003" }, { name: "Ambala Cantt",   pincode: "133001" }] },
    ],
  },
  {
    name: "Himachal Pradesh",
    districts: [
      { name: "Shimla",  cities: [{ name: "Shimla City",   pincode: "171001" }, { name: "Sanjauli",       pincode: "171006" }] },
      { name: "Dharamshala", cities: [{ name: "Dharamshala City", pincode: "176215" }, { name: "McLeod Ganj", pincode: "176219" }] },
    ],
  },
  {
    name: "Jharkhand",
    districts: [
      { name: "Ranchi",   cities: [{ name: "Ranchi City",   pincode: "834001" }, { name: "Doranda",        pincode: "834002" }, { name: "Kanke",          pincode: "834008" }] },
      { name: "Dhanbad",  cities: [{ name: "Dhanbad City",  pincode: "826001" }, { name: "Jharia",         pincode: "828111" }] },
    ],
  },
  {
    name: "Karnataka",
    districts: [
      {
        name: "Bengaluru",
        cities: [
          { name: "Koramangala",   pincode: "560034" }, { name: "Indiranagar",   pincode: "560038" },
          { name: "Whitefield",    pincode: "560066" }, { name: "Jayanagar",     pincode: "560041" },
          { name: "JP Nagar",      pincode: "560078" }, { name: "HSR Layout",    pincode: "560102" },
          { name: "Marathahalli",  pincode: "560037" }, { name: "Hebbal",        pincode: "560024" },
          { name: "Yeshwanthpur",  pincode: "560022" }, { name: "MG Road",       pincode: "560001" },
        ],
      },
      {
        name: "Mysuru",
        cities: [
          { name: "Mysuru City",   pincode: "570001" }, { name: "Vijayanagar",   pincode: "570017" },
          { name: "Kuvempunagar",  pincode: "570023" }, { name: "Nazarbad",      pincode: "570010" },
        ],
      },
      {
        name: "Hubli-Dharwad",
        cities: [
          { name: "Hubli City",    pincode: "580020" }, { name: "Dharwad",       pincode: "580001" },
          { name: "Navanagar",     pincode: "580025" },
        ],
      },
      {
        name: "Mangaluru",
        cities: [
          { name: "Attavar",       pincode: "575001" }, { name: "Kadri",         pincode: "575004" },
          { name: "Kankanady",     pincode: "575002" }, { name: "Bejai",         pincode: "575004" },
        ],
      },
    ],
  },
  {
    name: "Kerala",
    districts: [
      { name: "Thiruvananthapuram", cities: [{ name: "Thiruvananthapuram City", pincode: "695001" }, { name: "Pattom",   pincode: "695004" }, { name: "Kazhakuttom",  pincode: "695582" }] },
      { name: "Kochi",              cities: [{ name: "Ernakulam",               pincode: "682011" }, { name: "Kakkanad", pincode: "682030" }, { name: "Fort Kochi",   pincode: "682001" }] },
      { name: "Kozhikode",          cities: [{ name: "Kozhikode City",          pincode: "673001" }, { name: "Calicut Beach", pincode: "673032" }] },
    ],
  },
  {
    name: "Madhya Pradesh",
    districts: [
      { name: "Bhopal",      cities: [{ name: "Bhopal City",   pincode: "462001" }, { name: "Habibganj",     pincode: "462024" }, { name: "Arera Colony",   pincode: "462016" }] },
      { name: "Indore",      cities: [{ name: "Indore City",   pincode: "452001" }, { name: "Vijay Nagar",   pincode: "452010" }, { name: "Palasia",        pincode: "452001" }] },
      { name: "Jabalpur",    cities: [{ name: "Jabalpur City", pincode: "482001" }, { name: "Napier Town",   pincode: "482001" }] },
    ],
  },
  {
    name: "Maharashtra",
    districts: [
      {
        name: "Mumbai",
        cities: [
          { name: "Andheri",     pincode: "400053" }, { name: "Bandra",       pincode: "400050" },
          { name: "Borivali",    pincode: "400066" }, { name: "Dadar",        pincode: "400014" },
          { name: "Kurla",       pincode: "400070" }, { name: "Mulund",       pincode: "400080" },
          { name: "Goregaon",    pincode: "400063" }, { name: "Malad",        pincode: "400064" },
          { name: "Kandivali",   pincode: "400067" }, { name: "Lower Parel",  pincode: "400013" },
        ],
      },
      {
        name: "Pune",
        cities: [
          { name: "Shivajinagar", pincode: "411005" }, { name: "Kothrud",      pincode: "411029" },
          { name: "Hadapsar",     pincode: "411028" }, { name: "Viman Nagar",  pincode: "411014" },
          { name: "Baner",        pincode: "411045" }, { name: "Hinjewadi",    pincode: "411057" },
          { name: "Wakad",        pincode: "411057" }, { name: "Aundh",        pincode: "411007" },
        ],
      },
      {
        name: "Nashik",
        cities: [
          { name: "Nashik Road",  pincode: "422101" }, { name: "Deolali",      pincode: "422401" },
          { name: "Igatpuri",     pincode: "422403" }, { name: "Panchavati",   pincode: "422003" },
        ],
      },
      {
        name: "Nagpur",
        cities: [
          { name: "Civil Lines",  pincode: "440001" }, { name: "Dharampeth",   pincode: "440010" },
          { name: "Sitabuldi",    pincode: "440012" }, { name: "Sadar",        pincode: "440001" },
        ],
      },
      {
        name: "Thane",
        cities: [
          { name: "Thane West",   pincode: "400601" }, { name: "Kopri",        pincode: "400603" },
          { name: "Naupada",      pincode: "400602" }, { name: "Wagle Estate", pincode: "400604" },
        ],
      },
    ],
  },
  {
    name: "Manipur",
    districts: [
      { name: "Imphal West", cities: [{ name: "Imphal City", pincode: "795001" }, { name: "Lamphelpat", pincode: "795004" }] },
      { name: "Imphal East", cities: [{ name: "Porompat",    pincode: "795005" }] },
    ],
  },
  {
    name: "Meghalaya",
    districts: [
      { name: "East Khasi Hills", cities: [{ name: "Shillong City", pincode: "793001" }, { name: "Laban",         pincode: "793004" }] },
      { name: "Ri Bhoi",          cities: [{ name: "Nongpoh",       pincode: "793101" }] },
    ],
  },
  {
    name: "Mizoram",
    districts: [
      { name: "Aizawl", cities: [{ name: "Aizawl City",  pincode: "796001" }, { name: "Bawngkawn",      pincode: "796014" }] },
    ],
  },
  {
    name: "Nagaland",
    districts: [
      { name: "Kohima",  cities: [{ name: "Kohima City",  pincode: "797001" }, { name: "Dimapur",         pincode: "797112" }] },
    ],
  },
  {
    name: "Odisha",
    districts: [
      { name: "Bhubaneswar", cities: [{ name: "Bhubaneswar City", pincode: "751001" }, { name: "Patia",       pincode: "751031" }, { name: "Nayapalli",  pincode: "751012" }] },
      { name: "Cuttack",     cities: [{ name: "Cuttack City",     pincode: "753001" }, { name: "Badambadi",   pincode: "753012" }] },
      { name: "Rourkela",    cities: [{ name: "Rourkela City",    pincode: "769001" }, { name: "Sector 19",   pincode: "769005" }] },
    ],
  },
  {
    name: "Punjab",
    districts: [
      { name: "Amritsar",  cities: [{ name: "Amritsar City",  pincode: "143001" }, { name: "Ranjit Avenue",  pincode: "143001" }] },
      { name: "Ludhiana",  cities: [{ name: "Ludhiana City",  pincode: "141001" }, { name: "Model Town",     pincode: "141002" }] },
      { name: "Jalandhar", cities: [{ name: "Jalandhar City", pincode: "144001" }, { name: "Cantt",          pincode: "144005" }] },
    ],
  },
  {
    name: "Rajasthan",
    districts: [
      { name: "Jaipur",    cities: [{ name: "Jaipur City",    pincode: "302001" }, { name: "Vaishali Nagar", pincode: "302021" }, { name: "Malviya Nagar",  pincode: "302017" }] },
      { name: "Jodhpur",   cities: [{ name: "Jodhpur City",   pincode: "342001" }, { name: "Ratanada",       pincode: "342001" }] },
      { name: "Udaipur",   cities: [{ name: "Udaipur City",   pincode: "313001" }, { name: "Hiran Magri",    pincode: "313002" }] },
    ],
  },
  {
    name: "Sikkim",
    districts: [
      { name: "East Sikkim", cities: [{ name: "Gangtok City",  pincode: "737101" }, { name: "Ranipool",        pincode: "737135" }] },
    ],
  },
  {
    name: "Tamil Nadu",
    districts: [
      {
        name: "Chennai",
        cities: [
          { name: "T Nagar",      pincode: "600017" }, { name: "Anna Nagar",   pincode: "600040" },
          { name: "Adyar",        pincode: "600020" }, { name: "Velachery",    pincode: "600042" },
          { name: "Tambaram",     pincode: "600045" }, { name: "Perambur",     pincode: "600011" },
          { name: "Nungambakkam", pincode: "600034" }, { name: "Guindy",       pincode: "600032" },
        ],
      },
      {
        name: "Coimbatore",
        cities: [
          { name: "RS Puram",     pincode: "641002" }, { name: "Gandhipuram",  pincode: "641012" },
          { name: "Peelamedu",    pincode: "641004" }, { name: "Saibaba Colony", pincode: "641011" },
        ],
      },
      {
        name: "Madurai",
        cities: [
          { name: "Madurai City", pincode: "625001" }, { name: "Anna Nagar Madurai", pincode: "625020" },
          { name: "Villapuram",   pincode: "625012" },
        ],
      },
      { name: "Salem",          cities: [{ name: "Salem Town",    pincode: "636001" }, { name: "Fairlands",    pincode: "636016" }] },
      { name: "Tiruchirappalli", cities: [{ name: "Trichy City",  pincode: "620001" }, { name: "Srirangam",    pincode: "620006" }] },
    ],
  },
  {
    name: "Telangana",
    districts: [
      {
        name: "Hyderabad",
        cities: [
          { name: "Banjara Hills",  pincode: "500034" }, { name: "Jubilee Hills",  pincode: "500033" },
          { name: "Madhapur",       pincode: "500081" }, { name: "Secunderabad",   pincode: "500003" },
          { name: "Kukatpally",     pincode: "500072" }, { name: "LB Nagar",       pincode: "500074" },
        ],
      },
      { name: "Warangal",  cities: [{ name: "Warangal City",  pincode: "506002" }, { name: "Hanamkonda",  pincode: "506001" }] },
    ],
  },
  {
    name: "Tripura",
    districts: [
      { name: "West Tripura", cities: [{ name: "Agartala City",  pincode: "799001" }, { name: "Banamalipur",  pincode: "799001" }] },
    ],
  },
  {
    name: "Uttar Pradesh",
    districts: [
      { name: "Lucknow",    cities: [{ name: "Hazratganj",    pincode: "226001" }, { name: "Gomti Nagar",   pincode: "226010" }, { name: "Alambagh",       pincode: "226005" }] },
      { name: "Agra",       cities: [{ name: "Agra City",     pincode: "282001" }, { name: "Sikandra",      pincode: "282007" }] },
      { name: "Kanpur",     cities: [{ name: "Kanpur City",   pincode: "208001" }, { name: "Armapur",       pincode: "208009" }] },
      { name: "Varanasi",   cities: [{ name: "Varanasi City", pincode: "221001" }, { name: "Sigra",         pincode: "221010" }] },
      { name: "Noida",      cities: [{ name: "Noida Sector 18", pincode: "201301" }, { name: "Sector 62",   pincode: "201309" }] },
    ],
  },
  {
    name: "Uttarakhand",
    districts: [
      { name: "Dehradun",  cities: [{ name: "Dehradun City",  pincode: "248001" }, { name: "Rajpur Road",   pincode: "248001" }, { name: "Clement Town",   pincode: "248002" }] },
      { name: "Haridwar",  cities: [{ name: "Haridwar City",  pincode: "249401" }, { name: "BHEL Ranipur",  pincode: "249403" }] },
    ],
  },
  {
    name: "West Bengal",
    districts: [
      {
        name: "Kolkata",
        cities: [
          { name: "Park Street",  pincode: "700016" }, { name: "Salt Lake",    pincode: "700064" },
          { name: "Howrah",       pincode: "711101" }, { name: "New Alipore",  pincode: "700053" },
          { name: "Jadavpur",     pincode: "700032" }, { name: "Behala",       pincode: "700060" },
        ],
      },
      { name: "Siliguri",   cities: [{ name: "Siliguri City",   pincode: "734001" }, { name: "Pradhan Nagar", pincode: "734403" }] },
      { name: "Durgapur",   cities: [{ name: "Durgapur City",   pincode: "713201" }, { name: "Bidhan Nagar",  pincode: "713212" }] },
    ],
  },
  // ── Union Territories ────────────────────────────────────────────
  {
    name: "Delhi",
    districts: [
      {
        name: "New Delhi",
        cities: [
          { name: "Connaught Place", pincode: "110001" }, { name: "Karol Bagh",    pincode: "110005" },
          { name: "Lajpat Nagar",    pincode: "110024" }, { name: "Nehru Place",   pincode: "110019" },
        ],
      },
      { name: "North Delhi",  cities: [{ name: "Civil Lines",     pincode: "110054" }, { name: "Rohini",           pincode: "110085" }] },
      { name: "South Delhi",  cities: [{ name: "Hauz Khas",       pincode: "110016" }, { name: "Greater Kailash",  pincode: "110048" }, { name: "Saket",      pincode: "110017" }] },
      { name: "East Delhi",   cities: [{ name: "Laxmi Nagar",     pincode: "110092" }, { name: "Preet Vihar",      pincode: "110092" }] },
      { name: "West Delhi",   cities: [{ name: "Rajouri Garden",  pincode: "110027" }, { name: "Janakpuri",        pincode: "110058" }] },
    ],
  },
  {
    name: "Chandigarh",
    districts: [
      { name: "Chandigarh", cities: [{ name: "Sector 17",  pincode: "160017" }, { name: "Sector 22",        pincode: "160022" }, { name: "Sector 35",  pincode: "160035" }] },
    ],
  },
  {
    name: "Puducherry",
    districts: [
      { name: "Puducherry", cities: [{ name: "Puducherry City", pincode: "605001" }, { name: "Lawspet",          pincode: "605008" }] },
    ],
  },
  {
    name: "Jammu & Kashmir",
    districts: [
      { name: "Srinagar", cities: [{ name: "Srinagar City", pincode: "190001" }, { name: "Lal Chowk",       pincode: "190001" }] },
      { name: "Jammu",    cities: [{ name: "Jammu City",    pincode: "180001" }, { name: "Bakshi Nagar",    pincode: "180001" }] },
    ],
  },
  {
    name: "Ladakh",
    districts: [
      { name: "Leh",    cities: [{ name: "Leh City",    pincode: "194101" }] },
      { name: "Kargil", cities: [{ name: "Kargil Town", pincode: "194103" }] },
    ],
  },
  {
    name: "Andaman & Nicobar Islands",
    districts: [
      { name: "South Andaman", cities: [{ name: "Port Blair", pincode: "744101" }, { name: "Aberdeen Bazar", pincode: "744101" }] },
    ],
  },
  {
    name: "Dadra & Nagar Haveli and Daman & Diu",
    districts: [
      { name: "Daman",     cities: [{ name: "Daman City",   pincode: "396210" }] },
      { name: "Silvassa",  cities: [{ name: "Silvassa City", pincode: "396230" }] },
    ],
  },
  {
    name: "Lakshadweep",
    districts: [
      { name: "Kavaratti", cities: [{ name: "Kavaratti Island", pincode: "682555" }] },
    ],
  },
];

// ── Main Data Export ────────────────────────────────────────────────
export const LOCATION_DATA: Record<string, CountryData> = {
  "India":         { name: "India",         hasLocationData: true,  states: INDIA_STATES },
  "United States": { name: "United States", hasLocationData: false, states: [] },
  "United Kingdom":{ name: "United Kingdom",hasLocationData: false, states: [] },
  "Canada":        { name: "Canada",        hasLocationData: false, states: [] },
  "Australia":     { name: "Australia",     hasLocationData: false, states: [] },
  "Germany":       { name: "Germany",       hasLocationData: false, states: [] },
  "France":        { name: "France",        hasLocationData: false, states: [] },
  "Singapore":     { name: "Singapore",     hasLocationData: false, states: [] },
  "UAE":           { name: "UAE",           hasLocationData: false, states: [] },
  "Other":         { name: "Other",         hasLocationData: false, states: [] },
};

// ── Exported country list (replaces COUNTRIES const in Checkout.tsx) ──
export const COUNTRIES = Object.keys(LOCATION_DATA);

// ── Helper Functions ────────────────────────────────────────────────

export function getStates(country: string): string[] {
  const c = LOCATION_DATA[country];
  if (!c || !c.hasLocationData) return [];
  return c.states.map(s => s.name);
}

export function getDistricts(country: string, state: string): string[] {
  const c = LOCATION_DATA[country];
  if (!c || !c.hasLocationData) return [];
  const s = c.states.find(s => s.name === state);
  return s ? s.districts.map(d => d.name) : [];
}

export function getCities(country: string, state: string, district: string): CityData[] {
  const c = LOCATION_DATA[country];
  if (!c || !c.hasLocationData) return [];
  const s = c.states.find(s => s.name === state);
  if (!s) return [];
  const d = s.districts.find(d => d.name === district);
  return d ? d.cities : [];
}

export function getPincode(
  country: string,
  state: string,
  district: string,
  city: string,
): string {
  const cities = getCities(country, state, district);
  const found = cities.find(c => c.name === city);
  return found ? found.pincode : "";
}
