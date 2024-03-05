/**
 * Newspack Core Image, Loader
 */

/**
 * Dependencies
 */
// WordPress
import { Spinner } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
/**
 * Types
 */
import { AttributesMeta, AttributeProps } from './types';

const Loader = ( { attributes, setAttributes }: AttributeProps ) => {
	const imageId = attributes.id ?? 0;
	const { meta }: { meta: AttributesMeta } = useSelect(
		select => select( 'core' ).getMedia( imageId ),
		[ imageId ]
	) ?? {
		meta: {},
	};
	useEffect( () => {
		if ( Object.keys( meta ).length ) {
			const { _media_credit, _media_credit_url, _navis_media_credit_org } = meta;
			setAttributes( { meta: { _media_credit, _media_credit_url, _navis_media_credit_org } } );
		}
	}, [ Object.keys( meta ).length, attributes.caption ] );

	return (
		<>
			{ ! imageId
				? null
				: ! Object.keys( meta ).length && (
						<div className="newspack-block__core-image-background">
							<div className="newspack-block__core-image-spinner">
								<Spinner />
							</div>
						</div>
				  ) }
		</>
	);
};

export default Loader;
