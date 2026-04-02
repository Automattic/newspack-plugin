/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { ExternalLink, ToggleControl } from '@wordpress/components';

const { gates = [], taxonomyMap = {}, canEditGates = false } = window.newspackContentGates || {};

/**
 * Check if a gate's content rules match the current post state.
 *
 * @param {Array}  contentRules Gate content rules.
 * @param {string} postType     Current post type.
 * @param {Object} termsByTax   Map of taxonomy REST base to array of term IDs.
 *
 * @return {boolean} Whether all rules match.
 */
function gateMatchesPost( contentRules, postType, termsByTax ) {
	return contentRules.every( rule => {
		const isExclusion = rule.exclusion;
		if ( rule.slug === 'post_types' ) {
			return isExclusion ? ! rule.value.includes( postType ) : rule.value.includes( postType );
		}
		const restBase = taxonomyMap[ rule.slug ];
		if ( ! restBase ) {
			return false;
		}
		const postTerms = termsByTax[ restBase ] || [];
		if ( ! isExclusion && ! postTerms.length ) {
			return false;
		}
		const hasOverlap = rule.value.some( id => postTerms.includes( parseInt( id ) ) );
		return isExclusion ? ! hasOverlap : hasOverlap;
	} );
}

function PostSettings() {
	const { meta, postType, termsByTax } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const terms = {};
		Object.values( taxonomyMap ).forEach( restBase => {
			terms[ restBase ] = getEditedPostAttribute( restBase ) || [];
		} );
		return {
			meta: getEditedPostAttribute( 'meta' ),
			postType: getEditedPostAttribute( 'type' ),
			termsByTax: terms,
		};
	} );
	const { editPost } = useDispatch( 'core/editor' );

	const matchingGates = useMemo(
		() => gates.filter( gate => gateMatchesPost( gate.content_rules, postType, termsByTax ) ),
		[ postType, termsByTax ]
	);

	return (
		<PluginDocumentSettingPanel name="content-gate-post-exemptions-panel" title={ __( 'Access control settings', 'newspack-plugin' ) }>
			{ matchingGates.length > 0 ? (
				<p>
					{ __( 'Gates that apply to this post: ', 'newspack-plugin' ) }
					{ matchingGates.map( ( gate, index ) => (
						<span key={ gate.id }>
							{ index > 0 && ', ' }
							{ canEditGates && gate.edit_url ? <a href={ gate.edit_url }>{ gate.title }</a> : gate.title }
						</span>
					) ) }
				</p>
			) : (
				<p>{ __( 'No gates apply to this post.', 'newspack-plugin' ) }</p>
			) }
			<hr />
			<ToggleControl
				label={ __( 'Disable access control restrictions for this post', 'newspack-plugin' ) }
				help={
					<>
						{ __(
							'If enabled, this post will be accessible to all readers regardless of content restriction rules.',
							'newspack-plugin'
						) }{ ' ' }
						<ExternalLink href="/wp-admin/admin.php?page=newspack-audience-access-control">
							{ __( 'Manage access control', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				}
				checked={ meta.newspack_content_restriction_is_exempt }
				onChange={ value => editPost( { meta: { newspack_content_restriction_is_exempt: value } } ) }
			/>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'newspack-content-gate-post-exemptions', {
	render: PostSettings,
	icon: null,
} );
