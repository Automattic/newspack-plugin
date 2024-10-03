/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BrandActionCard from './list-card';
import { Card, Button, Router } from '../../../../../components/src';

const { NavLink } = Router;

function BrandsListHeader( {
	isFetching = false,
	title,
	children,
}: {
	title: string;
	isFetching?: boolean;
	children?: React.ReactNode;
} ) {
	return (
		<Fragment>
			<Card headerActions noBorder>
				<h2>{ title }</h2>
				<NavLink to="/additional-brands/new">
					<Button variant="primary">
						{ isFetching
							? __(
									'Fetching Additional Brands…',
									'newspack-plugin'
							  )
							: __( 'Add New Brand', 'newspack-plugin' ) }
					</Button>
				</NavLink>
			</Card>
			{ children }
		</Fragment>
	);
}

export default function BrandsList( {
	brands,
	isFetching,
	deleteBrand,
}: {
	brands: Brand[];
	isFetching: boolean;
	deleteBrand: ( brand: Brand ) => void;
} ) {
	if ( isFetching ) {
		<BrandsListHeader
			title={ __( 'Fetching brands…', 'newspack-plugin' ) }
			isFetching
		/>;
	}
	return brands.length ? (
		<Fragment>
			<BrandsListHeader
				title={ __( 'Site brands', 'newspack-plugin' ) }
				isFetching={ isFetching }
			>
				{ brands.map( brand => (
					<BrandActionCard
						key={ brand.id }
						brand={ brand }
						deleteBrand={ deleteBrand }
					/>
				) ) }
			</BrandsListHeader>
		</Fragment>
	) : (
		<Fragment>
			<BrandsListHeader
				title={ __( 'You have no saved brands.', 'newspack-plugin' ) }
				isFetching={ isFetching }
			>
				<p>
					{ __(
						'Create brands to enhance your readers experience.',
						'newspack-plugin'
					) }
				</p>
			</BrandsListHeader>
		</Fragment>
	);
}
