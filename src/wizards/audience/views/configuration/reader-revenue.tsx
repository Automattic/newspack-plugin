import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Modal, Grid, Button } from '../../../../components/src';

function ReaderRevenue( {
	// onClose,
	isOpen = false,
}: {
	// onClose: () => void;
	isOpen: boolean;
} ) {
	const [ isModalOpen, setIsModalOpen ] = useState( isOpen );
	return (
		<Grid columns={ 2 } gutter={ 16 }>
			<div>
				<Button
					onClick={ () => setIsModalOpen( ! isModalOpen ) }
					variant="primary"
				>
					{ __(
						'Update Reader Revenue settings',
						'newspack-plugin'
					) }
				</Button>
				{ isModalOpen && (
					<Modal
						title="Reader Revenue"
						onRequestClose={ () => setIsModalOpen( ! isModalOpen ) }
					>
						Reader Revenue Settings...
					</Modal>
				) }
			</div>
		</Grid>
	);
}

export default ReaderRevenue;
