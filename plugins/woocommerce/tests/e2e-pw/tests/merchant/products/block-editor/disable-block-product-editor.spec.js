const { test } = require( '@playwright/test' );
const {
	clickAddNewMenuItem,
	expectBlockProductEditor,
	expectOldProductEditor,
	isBlockProductEditorEnabled,
	toggleBlockProductEditor,
} = require( '../../../../utils/simple-products' );
const { toggleBlockProductTour } = require( '../../../../utils/tours' );

const ALL_PRODUCTS_URL = 'wp-admin/edit.php?post_type=product';
const NEW_EDITOR_ADD_PRODUCT_URL =
	'wp-admin/admin.php?page=wc-admin&path=%2Fadd-product';

let isNewProductEditorEnabled = false;

const isTrackingSupposedToBeEnabled = !! process.env.ENABLE_TRACKING;

async function dismissFeedbackModalIfShown( page ) {
	try {
		await page.getByText( 'Skip' ).nth( 3 ).click( { timeout: 5000 } );
	} catch ( error ) {}
}

test.describe.configure( { mode: 'serial' } );

test.describe( 'Disable block product editor', () => {
	test.use( { storageState: process.env.ADMINSTATE } );

	test.beforeAll( async ( { request } ) => {
		await toggleBlockProductTour( request, false );
	} );

	test.beforeEach( async ( { page } ) => {
		isNewProductEditorEnabled = await isBlockProductEditorEnabled( page );
		if ( ! isNewProductEditorEnabled ) {
			await toggleBlockProductEditor( 'enable', page );
		}
	} );

	test.afterEach( async ( { browser } ) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		isNewProductEditorEnabled = await isBlockProductEditorEnabled( page );
		if ( isNewProductEditorEnabled ) {
			await toggleBlockProductEditor( 'disable', page );
		}
	} );

	test.skip(
		isNewProductEditorEnabled && isTrackingSupposedToBeEnabled,
		'The block product editor is not being tested'
	);

	test( 'is hooked up to sidebar "Add New"', async ( { page } ) => {
		await page.goto( ALL_PRODUCTS_URL );
		await clickAddNewMenuItem( page );
		await expectBlockProductEditor( page );
	} );

	test( 'can be disabled from the header', async ( { page } ) => {
		await page.goto( NEW_EDITOR_ADD_PRODUCT_URL );

		// turn off block product editor from the header
		await page
			.locator( '.components-dropdown-menu' )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page
			.getByRole( 'menuitem', {
				name: 'Turn off the new product form',
			} )
			.click();
		await dismissFeedbackModalIfShown( page );
		await expectOldProductEditor( page );
	} );

	test( 'can be disabled from settings', async ( { page } ) => {
		await toggleBlockProductEditor( 'disable', page );
		await page.goto( ALL_PRODUCTS_URL );
		await clickAddNewMenuItem( page );
		await expectOldProductEditor( page );
	} );
} );