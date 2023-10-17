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
		return lists.filter( list => list.active && ! selected.includes( list.id ) );
	};
	return (
		<div className="newspack__newsletter-list-control">
			<div className="newspack__newsletter-list-control__selected">
				{ selected.map( listId => {
					const list = getList( listId );
					if ( ! list ) {
						return null;
					}
					return (
						<ActionCard
							key={ `selected-${ listId }` }
							title={ list.name }
							description={ list.description }
							isSmall
							actionText={
								<>
									<Button
										onClick={ () => onChange( selected.filter( id => id !== listId ) ) }
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
											const index = selected.findIndex( item => item === listId );
											if ( index === 0 ) {
												return;
											}
											const newSelected = [ ...selected ];
											newSelected.splice( index, 1 );
											newSelected.splice( index - 1, 0, listId );
											onChange( newSelected );
										} }
										className={
											selected.findIndex( item => item === listId ) === 0 ? 'disabled' : ''
										}
									>
										<Icon icon={ chevronUp } />
									</button>
									<button
										onClick={ () => {
											const index = selected.findIndex( item => item === listId );
											const newSelected = [ ...selected ];
											newSelected.splice( index, 1 );
											newSelected.splice( index + 1, 0, listId );
											onChange( newSelected );
										} }
										className={
											selected.findIndex( item => item === listId ) === selected.length - 1
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
								onClick={ () => onChange( [ ...selected, list.id ] ) }
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
