/**
 * Box Contrast
 *
 * can be used to dynamically assign black or white color/background-color based on a hex color.
 * Black/white can be assigned to either text or background-color.
 */

/**
 * Dependencies
 */
import { getContrast } from '../utils/color';

/**
 * Box Contrast component
 *
 * @return JSX.Element
 */
const BoxContrast = ( {
	hexColor,
	cssProp,
	children,
	...props
}: {
	children: string | JSX.Element;
	hexColor: string;
	cssProp: 'color' | 'background-color';
	className?: string;
} ) => {
	const contrastColor = getContrast( hexColor );
	const style =
		cssProp === 'color'
			? { color: contrastColor }
			: { backgroundColor: hexColor, color: contrastColor };

	return (
		<div { ...props } style={ style }>
			{ children }
		</div>
	);
};

export default BoxContrast;
