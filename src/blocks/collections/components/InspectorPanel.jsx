import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, SelectControl, ButtonGroup, Button, BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

import { AutocompleteTokenField } from '../../../components/src';
import {
	fetchCategorySuggestions as fetchCategorySuggestionsRaw,
	fetchSavedCategories as fetchSavedCategoriesRaw,
	fetchCollectionSuggestions as fetchCollectionSuggestionsRaw,
	fetchSavedCollections as fetchSavedCollectionsRaw,
} from '../utils/api';

const InspectorPanel = ( { attributes, setAttributes } ) => {
	const {
		queryType,
		numberOfItems,
		offset,
		selectedCollections,
		includeCategories,
		excludeCategories,
		layout,
		columns,
		imageAlignment,
		imageSize,
		showFeaturedImage,
		showCategory,
		showTitle,
		showExcerpt,
		showVolume,
		showNumber,
		showPeriod,
		showSubscriptionUrl,
		showOrderUrl,
		showCTAs,
		numberOfCTAs,
		specificCTAs,
		showSeeAllLink,
		seeAllLinkText,
	} = attributes;

	// Category suggestions.
	const fetchCategorySuggestions = useCallback( search => fetchCategorySuggestionsRaw( search ), [] );

	// Saved categories.
	const fetchSavedCategories = useCallback( categoryIDs => fetchSavedCategoriesRaw( categoryIDs ), [] );

	// Collection suggestions.
	const fetchCollectionSuggestions = useCallback( search => fetchCollectionSuggestionsRaw( search ), [] );

	// Saved collections.
	const fetchSavedCollections = useCallback( collectionIDs => fetchSavedCollectionsRaw( collectionIDs ), [] );

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Query Settings', 'newspack-plugin' ) }>
				<SelectControl
					label={ __( 'Query Type', 'newspack-plugin' ) }
					value={ queryType }
					options={ [
						{ label: __( 'Recent Collections', 'newspack-plugin' ), value: 'recent' },
						{ label: __( 'Specific Collections', 'newspack-plugin' ), value: 'specific' },
					] }
					onChange={ value => setAttributes( { queryType: value } ) }
				/>

				{ queryType === 'specific' && (
					<AutocompleteTokenField
						tokens={ selectedCollections || [] }
						onChange={ value => setAttributes( { selectedCollections: value } ) }
						fetchSuggestions={ fetchCollectionSuggestions }
						fetchSavedInfo={ fetchSavedCollections }
						label={ __( 'Select Collections', 'newspack-plugin' ) }
						help={ __( 'Type to search and select specific collections to display.', 'newspack-plugin' ) }
					/>
				) }

				{ queryType === 'recent' && (
					<>
						<RangeControl
							label={ __( 'Number of Collections', 'newspack-plugin' ) }
							value={ numberOfItems }
							onChange={ value => setAttributes( { numberOfItems: value } ) }
							min={ 1 }
							max={ 24 }
						/>

						<RangeControl
							label={ __( 'Offset', 'newspack-plugin' ) }
							value={ offset }
							onChange={ value => setAttributes( { offset: value } ) }
							min={ 0 }
							max={ 50 }
							help={ __( 'Number of collections to skip from the beginning', 'newspack-plugin' ) }
						/>

						<AutocompleteTokenField
							tokens={ includeCategories }
							onChange={ value => setAttributes( { includeCategories: value } ) }
							fetchSuggestions={ fetchCategorySuggestions }
							fetchSavedInfo={ fetchSavedCategories }
							label={ __( 'Include Categories', 'newspack-plugin' ) }
							help={ __( 'Type to search categories to include.', 'newspack-plugin' ) }
						/>

						<AutocompleteTokenField
							tokens={ excludeCategories }
							onChange={ value => setAttributes( { excludeCategories: value } ) }
							fetchSuggestions={ fetchCategorySuggestions }
							fetchSavedInfo={ fetchSavedCategories }
							label={ __( 'Exclude Categories', 'newspack-plugin' ) }
							help={ __( 'Type to search categories to exclude.', 'newspack-plugin' ) }
						/>
					</>
				) }
			</PanelBody>

			<PanelBody title={ __( 'Layout Settings', 'newspack-plugin' ) }>
				<BaseControl id="collections-layout" label={ __( 'Layout', 'newspack-plugin' ) }>
					<ButtonGroup>
						<Button isPressed={ layout === 'list' } onClick={ () => setAttributes( { layout: 'list' } ) }>
							{ __( 'List', 'newspack-plugin' ) }
						</Button>
						<Button isPressed={ layout === 'grid' } onClick={ () => setAttributes( { layout: 'grid' } ) }>
							{ __( 'Grid', 'newspack-plugin' ) }
						</Button>
					</ButtonGroup>
				</BaseControl>

				{ layout === 'grid' && (
					<RangeControl
						label={ __( 'Columns', 'newspack-plugin' ) }
						value={ columns }
						onChange={ value => setAttributes( { columns: value } ) }
						min={ 1 }
						max={ 6 }
					/>
				) }

				{ layout === 'list' && (
					<>
						<BaseControl id="collections-image-alignment" label={ __( 'Image Alignment', 'newspack-plugin' ) }>
							<ButtonGroup>
								<Button isPressed={ imageAlignment === 'top' } onClick={ () => setAttributes( { imageAlignment: 'top' } ) }>
									{ __( 'Top', 'newspack-plugin' ) }
								</Button>
								<Button isPressed={ imageAlignment === 'left' } onClick={ () => setAttributes( { imageAlignment: 'left' } ) }>
									{ __( 'Left', 'newspack-plugin' ) }
								</Button>
								<Button isPressed={ imageAlignment === 'right' } onClick={ () => setAttributes( { imageAlignment: 'right' } ) }>
									{ __( 'Right', 'newspack-plugin' ) }
								</Button>
							</ButtonGroup>
						</BaseControl>

						<BaseControl id="collections-image-size" label={ __( 'Image Size', 'newspack-plugin' ) }>
							<ButtonGroup>
								<Button isPressed={ imageSize === 'small' } onClick={ () => setAttributes( { imageSize: 'small' } ) }>
									{ __( 'Small', 'newspack-plugin' ) }
								</Button>
								<Button isPressed={ imageSize === 'medium' } onClick={ () => setAttributes( { imageSize: 'medium' } ) }>
									{ __( 'Medium', 'newspack-plugin' ) }
								</Button>
								<Button isPressed={ imageSize === 'large' } onClick={ () => setAttributes( { imageSize: 'large' } ) }>
									{ __( 'Large', 'newspack-plugin' ) }
								</Button>
							</ButtonGroup>
						</BaseControl>
					</>
				) }
			</PanelBody>

			<PanelBody title={ __( 'Display Settings', 'newspack-plugin' ) }>
				<ToggleControl
					label={ __( 'Show Featured Image', 'newspack-plugin' ) }
					checked={ showFeaturedImage }
					onChange={ value => setAttributes( { showFeaturedImage: value } ) }
				/>

				<ToggleControl
					label={ __( 'Show Category', 'newspack-plugin' ) }
					checked={ showCategory }
					onChange={ value => setAttributes( { showCategory: value } ) }
				/>

				<ToggleControl
					label={ __( 'Show Title', 'newspack-plugin' ) }
					checked={ showTitle }
					onChange={ value => setAttributes( { showTitle: value } ) }
				/>

				<ToggleControl
					label={ __( 'Show Excerpt', 'newspack-plugin' ) }
					checked={ showExcerpt }
					onChange={ value => setAttributes( { showExcerpt: value } ) }
				/>

				<ToggleControl
					label={ __( 'Show Period', 'newspack-plugin' ) }
					checked={ showPeriod }
					onChange={ value => setAttributes( { showPeriod: value } ) }
				/>

				<ToggleControl
					label={ __( 'Show Volume', 'newspack-plugin' ) }
					checked={ showVolume }
					onChange={ value => setAttributes( { showVolume: value } ) }
				/>

				<ToggleControl
					label={ __( 'Show Number', 'newspack-plugin' ) }
					checked={ showNumber }
					onChange={ value => setAttributes( { showNumber: value } ) }
				/>

				<ToggleControl
					label={ __( 'Show CTAs', 'newspack-plugin' ) }
					checked={ showCTAs }
					onChange={ value => setAttributes( { showCTAs: value } ) }
				/>

				{ showCTAs && (
					<>
						<RangeControl
							label={ __( 'Number of CTAs', 'newspack-plugin' ) }
							value={ numberOfCTAs }
							onChange={ value => setAttributes( { numberOfCTAs: value } ) }
							min={ 1 }
							max={ 5 }
							help={ __( 'Maximum number of CTAs to display', 'newspack-plugin' ) }
						/>

						<ToggleControl
							label={ __( 'Show Subscription URL', 'newspack-plugin' ) }
							checked={ showSubscriptionUrl }
							onChange={ value => setAttributes( { showSubscriptionUrl: value } ) }
						/>

						<ToggleControl
							label={ __( 'Show Order URL', 'newspack-plugin' ) }
							checked={ showOrderUrl }
							onChange={ value => setAttributes( { showOrderUrl: value } ) }
						/>

						<BaseControl
							id="specific-ctas-control"
							label={ __( 'Specific CTAs (comma-separated)', 'newspack-plugin' ) }
							help={ __(
								'Enter specific CTA to show, e.g. "Digital Edition" (should match existing CTA label). Leave empty to show first available CTAs.',
								'newspack-plugin'
							) }
						>
							<input
								type="text"
								value={ specificCTAs }
								onChange={ e => setAttributes( { specificCTAs: e.target.value } ) }
								placeholder={ __( '', 'newspack-plugin' ) }
								className="components-text-control__input"
							/>
						</BaseControl>
					</>
				) }

				<ToggleControl
					label={ __( 'Show "See All" Link', 'newspack-plugin' ) }
					checked={ showSeeAllLink }
					onChange={ value => setAttributes( { showSeeAllLink: value } ) }
				/>

				{ showSeeAllLink && (
					<BaseControl
						id="see-all-text-control"
						label={ __( 'See All Link Text', 'newspack-plugin' ) }
						help={ __( 'Custom text for the see all link.', 'newspack-plugin' ) }
					>
						<input
							type="text"
							value={ seeAllLinkText }
							onChange={ e => setAttributes( { seeAllLinkText: e.target.value } ) }
							placeholder={ __( 'See all', 'newspack-plugin' ) }
							className="components-text-control__input"
						/>
					</BaseControl>
				) }
			</PanelBody>
		</InspectorControls>
	);
};

export default InspectorPanel;
