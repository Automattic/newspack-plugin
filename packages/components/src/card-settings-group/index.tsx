/**
 * Card - Settings group component.
 */

/**
 * Internal dependencies
 */
import { Card } from '../';
import './style.scss';

const CardSettingsGroup = ( {
	actionType = 'none',
	children,
	className,
	icon = null,
	iconSize,
	headerAction,
	title = '',
	description = '',
	isActive = false,
	onEnable = () => {},
	onHeaderClick = () => {},
}: {
	actionType?: 'chevron' | 'toggle' | 'button' | 'link' | 'none';
	children?: React.ReactNode;
	className?: string;
	icon?: React.ReactNode;
	iconSize?: number;
	title: string;
	headerAction?: {
		label: string;
		icon?: React.ReactNode;
		href?: string;
		onClick?: () => void;
		disabled?: boolean;
		destructive?: boolean;
		tone?: 'primary' | 'secondary' | 'tertiary' | 'link';
		variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
	};
	description?: string;
	isActive?: boolean;
	onEnable?: () => void;
	onHeaderClick?: () => void;
} ) => {
	return (
		<Card
			className={ [ 'newspack-card--core--settings-group', className ].filter( Boolean ).join( ' ' ) }
			actionType={ actionType }
			isSmall
			__experimentalCoreCard
			__experimentalCoreProps={ {
				header: (
					<>
						<h3>{ title }</h3>
						{ description && <p>{ description }</p> }
					</>
				),
				headerAction,
				onHeaderClick,
				onToggle: onEnable,
				icon,
				iconBackgroundColor: true,
				iconSize,
				isActive,
				title,
			} }
		>
			{ isActive && children }
		</Card>
	);
};

export default CardSettingsGroup;
