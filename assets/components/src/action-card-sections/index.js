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
	const [ filter, setFilter ] = useState( ALL_FILTER.value );

	const renderedSections = useMemo( () => {
		const validFilters = sections.reduce(
			( acc, section ) =>
				section.items.length > 0 ? [ ...acc, { label: section.label, value: section.key } ] : acc,
			[ ALL_FILTER ]
		);
		if ( ! validFilters.reduce( ( filterFound, item ) => ( filter === item.value ? true : filterFound ), false ) ) {
			setFilter( ALL_FILTER.value );
		}
		const validSections = sections.reduce( ( validSectionsAcc, section ) => {
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
							{ validFilters.length > 0 && validSectionsAcc.length === 0 ? (
								<div className="newspack-action-card-sections__group-wrapper">
									<Heading />
									<SelectControl
										options={ validFilters }
										value={ filter }
										onChange={ setFilter }
										label={ __( 'Filter:', 'newspack' ) }
										labelPosition="side"
									/>
								</div>
							) : (
								<Heading />
							) }

							{ section.items.map( item => renderCard( item, section ) ) }
						</Fragment>
					);
				}
			}
			return validSectionsAcc;
		}, [] );

		return validSections;
	}, [ sections, filter ] );

	return renderedSections.length > 0 ? (
		<Fragment>{ renderedSections }</Fragment>
	) : (
		<p>{ emptyMessage }</p>
	);
};

export default ActionCardSections;
