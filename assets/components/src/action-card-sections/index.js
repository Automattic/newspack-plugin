/**
 * WordPress dependencies.
 */
import { useState, useMemo, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SelectControl from '../select-control';
import './style.scss';

const ALL_FILTER = { label: __( 'All', 'newspack' ), value: 'all' };

const ActionCardSections = ( { sections, emptyMessage, renderCard } ) => {
	const [ allFilters, setAllFilters ] = useState( [ ALL_FILTER ] );
	const [ filter, setFilter ] = useState( allFilters[ 0 ].value );

	const renderedSections = useMemo( () => {
		const validFilters = [ ALL_FILTER ];
		const validSections = sections.reduce( ( validSectionsAcc, section, i ) => {
			if ( section.items.length > 0 ) {
				const Heading = () => (
					<h2 className="newspack-action-card-sections__group-type">
						{ section.label }{' '}
						<span className="newspack-action-card-sections__group-count">
							{ section.items.length }
						</span>
					</h2>
				);
				if ( filter === ALL_FILTER.value || filter === section.key ) {
					validSectionsAcc.push(
						<Fragment key={ section.key }>
							{ allFilters.length > 0 && i === 0 ? (
								<div className="newspack-action-card-sections__group-wrapper">
									<Heading />
									<SelectControl
										options={ allFilters }
										value={ filter }
										onChange={ setFilter }
										label={ __( 'Filter:', 'newspack' ) }
										className="newspack-action-card-sections__group-select"
									/>
								</div>
							) : (
								<Heading />
							) }

							{ section.items.map( item => renderCard( item, section ) ) }
						</Fragment>
					);
				}
				validFilters.push( { label: section.label, value: section.key } );
			}
			return validSectionsAcc;
		}, [] );
		setAllFilters( validFilters );

		return validSections;
	}, [ sections, filter, allFilters.length ] );

	return renderedSections.length > 0 ? (
		<Fragment>{ renderedSections }</Fragment>
	) : (
		<p>{ emptyMessage }</p>
	);
};

export default ActionCardSections;
