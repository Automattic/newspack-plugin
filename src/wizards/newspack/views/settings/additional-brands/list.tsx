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
					<Button variant="primary" disabled={ isFetching }>
						{ __( 'Add New Brand', 'newspack-plugin' ) }
					</Button>
				</NavLink>
			</Card>
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
	return (
		<Fragment>
			<BrandsListHeader
				title={
					! brands.length && ! isFetching
						? __( 'You have no saved brands.', 'newspack-plugin' )
						: __( 'Site brands', 'newspack-plugin' )
				}
				isFetching={ isFetching }
			/>
			{ brands.length ? (
				brands.map( brand => (
					<BrandActionCard
						key={ brand.id }
						brand={ brand }
						deleteBrand={ deleteBrand }
					/>
				) )
			) : (
				<Fragment>
					{ isFetching ? (
						<p>{ __( 'Fetching brands…', 'newspack-plugin' ) }</p>
					) : (
						<p>
							{ __(
								'Create brands to enhance your readers experience.',
								'newspack-plugin'
							) }
						</p>
					) }
				</Fragment>
			) }
		</Fragment>
	);
}
