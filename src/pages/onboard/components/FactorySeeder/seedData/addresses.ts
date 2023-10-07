import type { Address } from '@prisma/client';

export const generateRandomAddress = (): Omit<Address, 'id' | 'customerId'> => ({
	street: generateRandomStreet(),
	city: generateRandomCity(),
	state: getRandomStateAbbreviation(),
	zip: generateRandomZip(),
});

const generateRandomInteger = (min = 1, max = 3000) => min + Math.floor(Math.random() * (max - min));

const generateRandomStreet = () => `${generateRandomInteger()} ${getRandomName()} ${getRandomStreetType()}`;

const generateRandomCity = () => getRandomName();

const generateRandomZip = () => `${generateRandomInteger(1000, 99999)}`.padStart(5, '0');

const streetTypes = [
	'St',
	'Ave',
	'Ln',
	'Dr',
	'Way'
];
const getRandomStreetType = () => streetTypes[Math.floor(Math.random() * streetTypes.length)] ?? 'St';

/**
 * Imaginary street/city names courtesy of City Name Generator
 * https://www.fantasynamegenerators.com/city-names.php 
 */
const names = [
	'Upoville',
	'Fraville',
	'Opledon',
	'Flistin',
	'Zlaevine',
	'Vrido',
	'Udrolk',
	'Lando',
	'Encegas',
	'Alechester',
	'Buxdon',
	'Laadson',
	'Ucroucrough',
	'Cifield',
	'Wradmery',
	'Ohido',
	'Kirie',
	'Efego',
	'Ontsea',
	'Oselas',
	'Yrehton',
	'Uchortin',
	'Struross',
	'Khieburg',
	'Khipbury',
	'Teka',
	'Kleles',
	'Vlando',
	'Ontbury',
	'Urydon',
];
const getRandomName = () => names[Math.floor(Math.random() * names.length)] ?? 'Random';

const stateNamesByAbbreviation: Record<string, string> = {
	"AL": "Alabama",
	"AK": "Alaska",
	"AS": "American Samoa",
	"AZ": "Arizona",
	"AR": "Arkansas",
	"CA": "California",
	"CO": "Colorado",
	"CT": "Connecticut",
	"DE": "Delaware",
	"DC": "District Of Columbia",
	"FM": "Federated States Of Micronesia",
	"FL": "Florida",
	"GA": "Georgia",
	"GU": "Guam",
	"HI": "Hawaii",
	"ID": "Idaho",
	"IL": "Illinois",
	"IN": "Indiana",
	"IA": "Iowa",
	"KS": "Kansas",
	"KY": "Kentucky",
	"LA": "Louisiana",
	"ME": "Maine",
	"MH": "Marshall Islands",
	"MD": "Maryland",
	"MA": "Massachusetts",
	"MI": "Michigan",
	"MN": "Minnesota",
	"MS": "Mississippi",
	"MO": "Missouri",
	"MT": "Montana",
	"NE": "Nebraska",
	"NV": "Nevada",
	"NH": "New Hampshire",
	"NJ": "New Jersey",
	"NM": "New Mexico",
	"NY": "New York",
	"NC": "North Carolina",
	"ND": "North Dakota",
	"MP": "Northern Mariana Islands",
	"OH": "Ohio",
	"OK": "Oklahoma",
	"OR": "Oregon",
	"PW": "Palau",
	"PA": "Pennsylvania",
	"PR": "Puerto Rico",
	"RI": "Rhode Island",
	"SC": "South Carolina",
	"SD": "South Dakota",
	"TN": "Tennessee",
	"TX": "Texas",
	"UT": "Utah",
	"VT": "Vermont",
	"VI": "Virgin Islands",
	"VA": "Virginia",
	"WA": "Washington",
	"WV": "West Virginia",
	"WI": "Wisconsin",
	"WY": "Wyoming"
};

const getRandomStateAbbreviation = () => {
	const abbreviations = Object.keys(stateNamesByAbbreviation);
	const randomIndex = generateRandomInteger(0, abbreviations.length);
	return abbreviations[randomIndex] ?? 'WY';
};