/**
 * Card Form component.
 *
 * A card with an expandable inline form — title, description, optional badge,
 * and an actions slot in the header. When `isOpen` is true, children are
 * rendered in the card body and the header border is removed for a seamless look.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis

/**
 * Internal dependencies
 */
import Badge from '../badge';
import Card from '../card';
import './style.scss';

type BadgeLevel = 'default' | 'info' | 'success' | 'warning' | 'error';

type CardFormProps = {
	title: string;
	description?: string;
	badge?: {
		text: string;
		level?: BadgeLevel;
	};
	/** JSX rendered in the header action area (buttons, etc.). */
	actions?: React.ReactNode;
	/** When true, children are shown and the header border is removed. */
	isOpen?: boolean;
	/** Called when the user presses Escape while the form is open. */
	onRequestClose?: () => void;
	className?: string;
	children?: React.ReactNode;
};

const CardForm = ( { title, description, badge, actions, isOpen = false, onRequestClose, className, children }: CardFormProps ) => {
	useEffect( () => {
		if ( ! isOpen || ! onRequestClose ) {
			return;
		}
		const handleKeyDown = ( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				onRequestClose();
			}
		};
		document.addEventListener( 'keydown', handleKeyDown );
		return () => document.removeEventListener( 'keydown', handleKeyDown );
	}, [ isOpen, onRequestClose ] );

	return (
		<Card
			className={ classnames( 'newspack-card-form', className, {
				'newspack-card-form--open': isOpen,
			} ) }
			__experimentalCoreCard
			isSmall
			__experimentalCoreProps={ {
				hasHeaderBorder: ! isOpen,
				header: (
					<HStack justify="space-between" style={ { width: '100%' } }>
						<VStack spacing={ 0 } style={ { flex: 1, minWidth: 0 } }>
							<h3 className="newspack-card-form__title">{ title }</h3>
							{ description && <p className="newspack-card-form__description">{ description }</p> }
						</VStack>
						<HStack spacing={ 2 } expanded={ false }>
							{ badge && <Badge text={ badge.text } level={ badge.level ?? 'success' } /> }
							{ actions }
						</HStack>
					</HStack>
				),
			} }
		>
			{ isOpen && children }
		</Card>
	);
};

export default CardForm;
