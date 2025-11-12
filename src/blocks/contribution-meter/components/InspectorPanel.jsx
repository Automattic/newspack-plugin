/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	BaseControl,
	DatePicker,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { dateI18n } from '@wordpress/date';

/**
 * Inspector panel component for contribution meter block settings.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update attributes.
 * @return {Element} InspectorPanel component.
 */
const InspectorPanel = ( { attributes, setAttributes } ) => {
	const { meterStyle, goalAmount, startDate, progressBarColor, thickness, showGoal, showAmountRaised, showPercentage } = attributes;

	// Convert YYYY-MM-DD string to Date object at local midnight to avoid timezone issues.
	// Only set currentStartDate if startDate exists, otherwise let DatePicker default to today.
	const currentStartDate = startDate ? new Date( startDate + 'T00:00:00' ) : undefined;

	const currencySymbol = window.newspack_contribution_meter_data?.currencySymbol || '$';

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Styles', 'newspack-plugin' ) }>
				<ToggleGroupControl value={ meterStyle } onChange={ value => setAttributes( { meterStyle: value } ) } isBlock __next40pxDefaultSize>
					<ToggleGroupControlOption label={ __( 'Linear', 'newspack-plugin' ) } value="linear" />
					<ToggleGroupControlOption label={ __( 'Circular', 'newspack-plugin' ) } value="circular" />
				</ToggleGroupControl>
			</PanelBody>

			<PanelColorSettings
				title={ __( 'Color', 'newspack-plugin' ) }
				colorSettings={ [
					{
						value: progressBarColor,
						onChange: value => setAttributes( { progressBarColor: value } ),
						label: __( 'Progress bar', 'newspack-plugin' ),
					},
				] }
			/>

			<PanelBody title={ __( 'Contribution data', 'newspack-plugin' ) }>
				<BaseControl
					id="contribution-meter-goal-amount"
					label={ __( 'Goal amount', 'newspack-plugin' ) + ` (${ currencySymbol })` }
					help={ __( 'Set the total contribution goal.', 'newspack-plugin' ) }
				>
					<input
						id="contribution-meter-goal-amount"
						type="number"
						value={ goalAmount }
						onChange={ e => setAttributes( { goalAmount: parseInt( e.target.value, 10 ) || 0 } ) }
						min="0"
						step="1"
						className="components-text-control__input"
					/>
				</BaseControl>

				<BaseControl
					id="contribution-meter-start-date"
					label={ __( 'Start date', 'newspack-plugin' ) }
					help={ __( 'Contributions from this date are included in the total amount raised.', 'newspack-plugin' ) }
				>
					<DatePicker
						currentDate={ currentStartDate }
						onChange={ newDate => {
							setAttributes( { startDate: newDate ? dateI18n( 'Y-m-d', newDate ) : '' } );
						} }
					/>
				</BaseControl>
			</PanelBody>

			<PanelBody title={ __( 'Progress bar', 'newspack-plugin' ) } initialOpen={ false }>
				<ToggleControl
					label={ __( 'Show goal', 'newspack-plugin' ) }
					checked={ showGoal }
					onChange={ value => setAttributes( { showGoal: value } ) }
					help={ __( 'Display the total target amount next to the progress bar.', 'newspack-plugin' ) }
				/>

				<ToggleControl
					label={ __( 'Show amount raised', 'newspack-plugin' ) }
					checked={ showAmountRaised }
					onChange={ value => setAttributes( { showAmountRaised: value } ) }
					help={ __( 'Display the total contributions received so far.', 'newspack-plugin' ) }
				/>

				<ToggleControl
					label={ __( 'Show percentage', 'newspack-plugin' ) }
					checked={ showPercentage }
					onChange={ value => setAttributes( { showPercentage: value } ) }
					help={ __( 'Display progress as a percentage of the goal.', 'newspack-plugin' ) }
				/>

				<ToggleGroupControl
					label={ __( 'Thickness', 'newspack-plugin' ) }
					value={ thickness }
					onChange={ value => setAttributes( { thickness: value } ) }
					isBlock
					help={ __( 'Adjust the visual weight of the progress bar.', 'newspack-plugin' ) }
					__next40pxDefaultSize
				>
					<ToggleGroupControlOption label={ __( 'XS', 'newspack-plugin' ) } value="xs" title={ __( 'Extra Small', 'newspack-plugin' ) } />
					<ToggleGroupControlOption label={ __( 'S', 'newspack-plugin' ) } value="s" title={ __( 'Small', 'newspack-plugin' ) } />
					<ToggleGroupControlOption label={ __( 'M', 'newspack-plugin' ) } value="m" title={ __( 'Medium', 'newspack-plugin' ) } />
					<ToggleGroupControlOption label={ __( 'L', 'newspack-plugin' ) } value="l" title={ __( 'Large', 'newspack-plugin' ) } />
				</ToggleGroupControl>
			</PanelBody>
		</InspectorControls>
	);
};

export default InspectorPanel;
