import type { Customer } from '@prisma/client';

/**
 * Ids will be auto-generated on insertion of record to database.
 * Related Address records will be created and connected during the 
 * same transaction as the Customer. 
 */
const customers: Pick<Customer, 'name'>[] = [
	{
		name: 'Conch Motor Oils'
	},
	{
		name: 'Arctic Mining Co.'
	},
	{
		name: 'Gears in the Rain Inc.'
	},
	{
		name: 'Squeekers Grease Shoppe'
	},
	{
		name: 'Payslate Budget Lubes'
	},
	{
		name: 'Chipper Drilling Conglomerate'
	}
];

export default customers;