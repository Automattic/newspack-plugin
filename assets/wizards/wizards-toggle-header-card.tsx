/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Grid, Button } from '../components/src';
import WizardsActionCard from './wizards-action-card';
import WizardError from './errors/class-wizard-error';
import { useWizardApiFetch } from './hooks/use-wizard-api-fetch';

type ToggleHeaderCardProps< T > = {
	title: string;
	description: string;
	namespace: string;
	path: string;
	defaultValue: T;
	fieldValidationMap: Array<
		[
			keyof T,
			{
				callback: 'isNonEmptyNumber' | 'isNonEmptyString' | ( ( v: any ) => string );
				dependsOn?: { [ k in keyof T ]?: string };
			}
		]
	>;
	renderProp: ( props: {
		settingsUpdates: T;
		setSettingsUpdates: React.Dispatch< React.SetStateAction< T > >;
		isFetching: boolean;
	} ) => React.ReactNode;
};

function validationCallbacks( { setError }: { setError: ( value: WizardErrorType ) => void } ) {
	return {
		isNonEmptyNumber( value: string ) {
			if ( ! value || isNaN( parseInt( value ) ) ) {
				setError(
					new WizardError(
						__( 'Please enter a valid number.', 'newspack-plugin' ),
						`invalid_${ value }`
					)
				);
				return false;
			}
			return true;
		},
		isNonEmptyString( value: string ) {
			if ( ! value ) {
				setError(
					new WizardError(
						__( 'Please enter a valid value.', 'newspack-plugin' ),
						`invalid_${ value }`
					)
				);
				return false;
			}
			return true;
		},
	};
}

const WizardsToggleHeaderCard = < T extends Record< string, any > >( {
	title,
	description,
	namespace,
	path,
	defaultValue,
	fieldValidationMap,
	renderProp,
}: ToggleHeaderCardProps< T > ) => {
	const { wizardApiFetch, isFetching, errorMessage, setError, resetError } =
		useWizardApiFetch( namespace );
	const [ settings, setSettings ] = useState< T >( { ...defaultValue } );
	const [ settingsUpdates, setSettingsUpdates ] = useState< T >( { ...defaultValue } );

	useEffect( () => {
		wizardApiFetch< T >(
			{ path },
			{
				onSuccess: ( res: T ) => {
					setSettings( res );
					setSettingsUpdates( res );
				},
			}
		);
	}, [] );

	const validations = validationCallbacks( { setError } );

	const updateSettings = ( data: T, isToggleSave = false ) => {
		resetError();

		if ( ! isToggleSave ) {
			for ( const [ field, validate ] of fieldValidationMap ) {
				if ( validate.dependsOn ) {
					const [ [ key, value ] ] = Object.entries( validate.dependsOn );
					if ( settingsUpdates[ key as keyof T ] !== value ) {
						continue;
					}
				}
				if ( typeof validate.callback === 'string' ) {
					if ( ! validations[ validate.callback ]( settingsUpdates[ field ] ) ) {
						return;
					}
				} else {
					const validationError = validate.callback( settingsUpdates[ field ] );
					if ( validationError ) {
						setError( new WizardError( validationError, `invalid_${ field.toString() }` ) );
						return;
					}
				}
			}
		}

		wizardApiFetch< T >(
			{
				path,
				method: 'POST',
				data,
				updateCacheMethods: [ 'GET' ],
			},
			{
				onSuccess: ( res: T ) => {
					console.log( { res } );
					setSettings( res );
					setSettingsUpdates( res );
				},
			}
		);
	};

	const renderCard = (
		onToggle: ( a: boolean, d: T ) => T,
		onChecked: ( a: T ) => boolean,
		renderCallback: ( a: any ) => React.ReactNode
	) => {
		const isChecked = onChecked( settingsUpdates );
		return (
			<WizardsActionCard
				title={ title }
				description={ description }
				hasGreyHeader={ isChecked }
				actionContent={
					isChecked && (
						<Button
							variant="primary"
							disabled={ isFetching }
							onClick={ () => updateSettings( settingsUpdates ) }
						>
							{ isFetching
								? __( 'Loading…', 'newspack-plugin' )
								: __( 'Save Settings', 'newspack-plugin' ) }
						</Button>
					)
				}
				error={ errorMessage }
				disabled={ isFetching }
				toggleOnChange={ active => {
					updateSettings( onToggle( active, settingsUpdates ), true );
				} }
				toggleChecked={ isChecked }
			>
				{ isChecked && renderCallback( { settingsUpdates, setSettingsUpdates, settings } ) }
			</WizardsActionCard>
		);
	};

	return renderCard(
		( active, settingsUpdates ) => ( { ...settingsUpdates, active } ),
		( data: T ) => data.active,
		( { settingsUpdates, isFetching } ) => (
			<Fragment>
				<Grid noMargin rowGap={ 16 } columns={ 1 }>
					{ renderProp( { settingsUpdates, setSettingsUpdates, isFetching } ) }
				</Grid>
			</Fragment>
		)
	);
};

export default WizardsToggleHeaderCard;
