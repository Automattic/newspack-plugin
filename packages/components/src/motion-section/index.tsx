/**
 * Motion Section
 *
 * A wrapper component that provides physics-based animations for sections
 * using Framer Motion. Animates children with stagger effects.
 */

/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { motion, Variants } from 'framer-motion';
import type { ReactNode } from 'react';

interface MotionSectionProps {
	children: ReactNode;
	className?: string;
	staggerDelay?: number;
	index?: number;
}

const MotionSection = ( { children, className = '', staggerDelay = 0.25, index: propIndex }: MotionSectionProps ) => {
	const [ index, setIndex ] = useState< number | null >( propIndex ?? null );
	const elementRef = useRef< HTMLDivElement >( null );

	useLayoutEffect( () => {
		// If index is manually provided, use it
		if ( propIndex !== undefined ) {
			setIndex( propIndex );
			return;
		}

		// Otherwise, detect position based on DOM order at the same level
		if ( ! elementRef.current ) {
			return;
		}

		// Find the parent element
		const parent = elementRef.current.parentElement;
		if ( ! parent ) {
			return;
		}

		// Find all MotionSections that are direct children of the same parent
		// This ensures nested sections get their own stagger sequence (indexed from 0)
		const siblingSections = Array.from( parent.children ).filter( child => {
			return child.hasAttribute( 'data-motion-section' );
		} ) as HTMLElement[];

		// Find this element's position among its siblings
		const currentIndex = siblingSections.indexOf( elementRef.current );
		if ( currentIndex !== -1 ) {
			setIndex( currentIndex );
		} else {
			// Fallback: if not found (shouldn't happen), use 0
			setIndex( 0 );
		}
	}, [ propIndex ] );

	const finalIndex = index ?? 0;

	const sectionVariants: Variants = {
		hidden: {
			opacity: 0,
			filter: 'blur(4px)',
		},
		visible: {
			opacity: 1,
			filter: 'none',
			transition: {
				type: 'spring',
				stiffness: 100,
				damping: 18,
				mass: 0.8,
				delay: finalIndex * staggerDelay,
			},
		},
	};

	return (
		<motion.div
			ref={ elementRef }
			className={ className }
			variants={ sectionVariants }
			initial="hidden"
			whileInView="visible"
			viewport={ { once: true, margin: '10px' } }
			data-motion-section
		>
			{ children }
		</motion.div>
	);
};

export default MotionSection;
