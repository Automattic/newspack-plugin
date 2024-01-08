/**
 * WordPress dependencies
 */
import { Icon, chevronUp, chevronDown, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ActionCard from '../action-card';
import Button from '../button';
import './style.scss';

export default function SortableNewsletterListControl( {
	lists,
	selected = [],
	onChange = () => {},
} ) {
	const getList = id => lists.find( list => list.id === id );
	const getAvailableLists = () => {
		return lists.filter( list => list.active && ! selected.find( ( { id } ) => id === list.id ) );
	};
	return (
		<div className="newspack__newsletter-list-control">
			<div className="newspack__newsletter-list-control__selected">
				{ selected.map( selectedList => {
					const list = getList( selectedList.id );
					if ( ! list ) {
						return null;
					}
					return (
						<ActionCard
							key={ `selected-${ selectedList.id }` }
							title={ list.name }
							description={ () => (
								<>
									<input
										type="checkbox"
										checked={ selectedList.checked }
										onChange={ () => {
											const index = selected.findIndex( ( { id } ) => id === selectedList.id );
											const newSelected = [ ...selected ];
											newSelected[ index ].checked = ! newSelected[ index ].checked;
											onChange( newSelected );
										} }
									/>
									{ __( 'Checked by default', 'newspack' ) }
								</>
							) }
							isSmall
							actionText={
								<>
									<Button
										onClick={ () =>
											onChange( selected.filter( ( { id } ) => id !== selectedList.id ) )
										}
										label={ __( 'Remove', 'newspack' ) }
										icon={ trash }
									/>
								</>
							}
						>
							{ selected.length > 1 && (
								<span className="newspack__newsletter-list-control__sort-handle">
									<button
										onClick={ () => {
											const index = selected.findIndex( ( { id } ) => id === selectedList.id );
											if ( index === 0 ) {
												return;
											}
											const newSelected = [ ...selected ];
											newSelected.splice( index, 1 );
											newSelected.splice( index - 1, 0, selectedList );
											onChange( newSelected );
										} }
										className={
											selected.findIndex( ( { id } ) => id === selectedList.id ) === 0
												? 'disabled'
												: ''
										}
									>
										<Icon icon={ chevronUp } />
									</button>
									<button
										onClick={ () => {
											const index = selected.findIndex( ( { id } ) => id === selectedList.id );
											const newSelected = [ ...selected ];
											newSelected.splice( index, 1 );
											newSelected.splice( index + 1, 0, selectedList );
											onChange( newSelected );
										} }
										className={
											selected.findIndex( ( { id } ) => id === selectedList.id ) ===
											selected.length - 1
												? 'disabled'
												: ''
										}
									>
										<Icon icon={ chevronDown } />
									</button>
								</span>
							) }
						</ActionCard>
					);
				} ) }
			</div>
			{ getAvailableLists().length > 0 && (
				<p className="newspack__newsletter-list-control__lists">
					{ selected.length > 0 ? (
						<strong>{ __( 'Add more lists:', 'newspack' ) }</strong>
					) : (
						<strong>{ __( 'Select lists:', 'newspack' ) }</strong>
					) }{ ' ' }
					{ getAvailableLists().map( list => {
						return (
							<Button
								key={ list.id }
								variant="secondary"
								onClick={ () => onChange( [ ...selected, { id: list.id, checked: true } ] ) }
							>
								{ list.name }
							</Button>
						);
					} ) }
				</p>
			) }
		</div>
	);
}
