import {
	Card,
	ActionCard,
	Button,
	Popover,
	Router,
} from '../../../../../components/src';

const { NavLink, useHistory } = Router;

import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import { moreVertical } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';
import { useState, Fragment } from '@wordpress/element';

const AddNewBrandLink = () => (
	<NavLink to="/additional-brands/brands/new">
		<Button variant="primary">
			{ __( 'Add New Brand', 'newspack-plugin' ) }
		</Button>
	</NavLink>
);

const BrandActionCard = ( {
	brand,
	deleteBrand,
}: {
	brand: Brand;
	deleteBrand: ( brand: Brand ) => void;
} ) => {
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const onFocusOutside = () => setPopoverVisibility( false );
	const history = useHistory();

	return (
		<ActionCard
			isSmall
			title={ brand.name }
			actionText={
				<>
					<Button
						onClick={ () =>
							setPopoverVisibility( ! popoverVisibility )
						}
						label={ __( 'More options', 'newspack-plugin' ) }
						icon={ moreVertical }
						className={ popoverVisibility ? 'popover-active' : '' }
					/>
					{ popoverVisibility && (
						<Popover
							position="bottom left"
							onKeyDown={ ( event: React.KeyboardEvent ) =>
								ESCAPE === event.keyCode && onFocusOutside
							}
							onFocusOutside={ onFocusOutside }
						>
							<MenuItem
								onClick={ () => onFocusOutside() }
								className="screen-reader-text"
							>
								{ __( 'Close Popover', 'newspack-plugin' ) }
							</MenuItem>
							<MenuItem
								onClick={ () =>
									history.push(
										`/additional-brands/brands/${ brand.id }`
									)
								}
								className="newspack-button"
							>
								{ __( 'Edit', 'newspack-plugin' ) }
							</MenuItem>
							<MenuItem
								onClick={ () => deleteBrand( brand ) }
								className="newspack-button"
							>
								{ __( 'Delete', 'newspack-plugin' ) }
							</MenuItem>
						</Popover>
					) }
				</>
			}
		/>
	);
};

export default function BrandsList( {
	brands,
	deleteBrand,
}: {
	brands: Brand[];
	deleteBrand: ( brand: Brand ) => void;
} ) {
	return brands.length ? (
		<Fragment>
			<Card headerActions noBorder>
				<h2>{ __( 'Site brands', 'newspack-plugin' ) }</h2>
				<AddNewBrandLink />
			</Card>
			{ brands.map( brand => (
				<BrandActionCard
					key={ brand.id }
					brand={ brand }
					deleteBrand={ deleteBrand }
				/>
			) ) }
		</Fragment>
	) : (
		<Fragment>
			<Card headerActions noBorder>
				<h2>
					{ __( 'You have no saved brands.', 'newspack-plugin' ) }
				</h2>
				<AddNewBrandLink />
			</Card>
			<p>
				{ __(
					'Create brands to enhance your readers experience.',
					'newspack-plugin'
				) }
			</p>
		</Fragment>
	);
}
