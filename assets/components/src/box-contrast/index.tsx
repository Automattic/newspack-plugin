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
 * @uses getContrast
 * @param param Props object
 * @returns JSX.Element
 */
const BoxContrast = ( {
	content,
	hexColor,
	cssProp,
	...props
}: {
	content: string | JSX.Element;
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
			{ content }
		</div>
	);
};

export default BoxContrast;
