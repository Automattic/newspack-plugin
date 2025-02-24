/**
 * Newspack - Dashboard, Quick Actions
 *
 * Quick Actions component provides editors quick access to content creation and viewing data relating to their site
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { Card, Grid, Button } from '../../../components/src';
import { Icon, icons } from './icons';

interface QuickAction {
	href: string;
	title: string;
	icon: keyof typeof icons;
	id: string;
}

interface DragData {
	action: QuickAction;
	isActive: boolean;
}

const MAX_ACTIVE_ACTIONS = 3;

const QuickActions = () => {
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [activeActions, setActiveActions] = useState<QuickAction[]>([]);
	const [inactiveActions, setInactiveActions] = useState<QuickAction[]>([]);
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const [isDragOverRemove, setIsDragOverRemove] = useState<boolean>(false);
	const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
	const [isDraggingInactive, setIsDraggingInactive] = useState<boolean>(false);

	// Initialize state from window object
	useEffect(() => {
		const { quickActions = [], availableQuickActions = [] } = (window as any).newspackDashboard || {};
		if (Array.isArray(quickActions) && Array.isArray(availableQuickActions)) {
			setActiveActions(quickActions);
			setInactiveActions(
				availableQuickActions.filter((action: QuickAction) => !quickActions.find((qa: QuickAction) => qa.id === action.id))
			);
		}
	}, []);

	useEffect(() => {
		document.addEventListener('dragend', handleDragEnd);
		return () => document.removeEventListener('dragend', handleDragEnd);
	}, []);

	const handleDragStart = (e: React.DragEvent, action: QuickAction, isActive: boolean) => {
		e.dataTransfer.setData('text/plain', JSON.stringify({ action, isActive }));
		setIsDragging(true);
		setIsDraggingActive(isActive);
		setIsDraggingInactive(!isActive);
	};

	const handleDragEnd = () => {
		setIsDragging(false);
		setIsDragOverRemove(false);
		setIsDraggingActive(false);
		setIsDraggingInactive(false);
		document.querySelectorAll('.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		if (isDraggingActive) {
			const rect = e.currentTarget.getBoundingClientRect();
			setIsDragOverRemove(e.clientY > rect.bottom - 80);
		}
	};

	const handleRemoveAction = (draggedAction: QuickAction) => {
		setActiveActions(activeActions.filter(a => a.id !== draggedAction.id));
		setInactiveActions([...inactiveActions, draggedAction]);
	};

	const handleReorderWithinList = (draggedAction: QuickAction, dropIndex: number, isDragActive: boolean) => {
		const sourceList = isDragActive ? activeActions : inactiveActions;
		const sourceIndex = sourceList.findIndex(a => a.id === draggedAction.id);
		const newList = [...sourceList];
		newList.splice(sourceIndex, 1);
		newList.splice(dropIndex, 0, draggedAction);

		if (isDragActive) {
			setActiveActions(newList);
		} else {
			setInactiveActions(newList);
		}
	};

	const handleMoveToInactive = (draggedAction: QuickAction, dropIndex: number) => {
		setActiveActions(activeActions.filter(a => a.id !== draggedAction.id));
		const newInactive = [...inactiveActions];
		newInactive.splice(dropIndex, 0, draggedAction);
		setInactiveActions(newInactive);
	};

	const handleMoveToActive = (draggedAction: QuickAction, dropIndex: number) => {
		if (dropIndex >= MAX_ACTIVE_ACTIONS) {
			return;
		}

		const newActive = [...activeActions];
		if (newActive.length >= MAX_ACTIVE_ACTIONS) {
			const replacedAction = newActive[dropIndex];
			newActive[dropIndex] = draggedAction;
			setActiveActions(newActive);
			const newInactive = [...inactiveActions.filter(a => a.id !== draggedAction.id), replacedAction];
			setInactiveActions(newInactive);
		} else {
			newActive.splice(dropIndex, 0, draggedAction);
			setActiveActions(newActive);
			setInactiveActions(inactiveActions.filter(a => a.id !== draggedAction.id));
		}
	};

	const handleDrop = (e: React.DragEvent, dropIndex?: number, isDropActive?: boolean) => {
		e.preventDefault();
		const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragData;
		const { action: draggedAction, isActive: isDragActive } = data;

		if (isDragOverRemove && isDragActive) {
			handleRemoveAction(draggedAction);
			handleDragEnd();
			return;
		}

		if (typeof dropIndex === 'undefined' || typeof isDropActive === 'undefined') {
			handleDragEnd();
			return;
		}

		if (isDragActive === isDropActive) {
			handleReorderWithinList(draggedAction, dropIndex, isDragActive);
		} else if (isDragActive) {
			handleMoveToInactive(draggedAction, dropIndex);
		} else {
			handleMoveToActive(draggedAction, dropIndex);
		}

		handleDragEnd();
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await apiFetch({
				path: '/wp/v2/newspack/quick-actions',
				method: 'POST',
				data: activeActions.map(action => action.id),
			});
			setIsEditing(false);
			(window as any).newspackDashboard = {
				...(window as any).newspackDashboard,
				quickActions: activeActions,
			};
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		const { quickActions = [], availableQuickActions = [] } = (window as any).newspackDashboard || {};
		if (Array.isArray(quickActions) && Array.isArray(availableQuickActions)) {
			setActiveActions(quickActions);
			setInactiveActions(
				availableQuickActions.filter((action: QuickAction) => !quickActions.find((qa: QuickAction) => qa.id === action.id))
			);
		}
		setIsEditing(false);
	};

	const handleReset = () => {
		const { availableQuickActions = [] } = (window as any).newspackDashboard || {};
		if (Array.isArray(availableQuickActions)) {
			setActiveActions(availableQuickActions.slice(0, MAX_ACTIVE_ACTIONS));
			setInactiveActions(availableQuickActions.slice(MAX_ACTIVE_ACTIONS));
		}
	};

	if (!activeActions.length && !inactiveActions.length) {
		return null;
	}

	const renderIcon = (iconName: keyof typeof icons) => {
		const iconSvg = icons[iconName];
		return iconSvg ? <Icon icon={iconSvg} /> : null;
	};

	const getRandomDelay = () => ({ '--wobble-delay': `${Math.random() * -1.5}s` });

	const ActionCard = ({ action }: { action: QuickAction }) => (
		<Card className="newspack-dashboard__card">
			<div className="newspack-dashboard__card-icon">
				{renderIcon(action.icon)}
			</div>
			<h4>{action.title}</h4>
		</Card>
	);

	const PlaceholderCard = () => (
		<Card className="newspack-dashboard__card">
			<div className="newspack-dashboard__card-placeholder">
				{renderIcon('plus')}
			</div>
		</Card>
	);

	const RemoveZoneCard = () => (
		<Card className="newspack-dashboard__card">
			<div className="newspack-dashboard__card-placeholder">
				{renderIcon('trash')}
			</div>
		</Card>
	);

	return (
		<div
			className={`newspack-dashboard__section ${isSaving ? 'is-saving' : ''}`}
			onDragOver={handleDragOver}
		>
			{isSaving && (
				<div className="newspack-dashboard__section-overlay">
					<Spinner />
				</div>
			)}
			<div className="newspack-dashboard__section-header">
				<h3>{ __( 'Quick actions', 'newspack-plugin' ) }</h3>
				{!isEditing ? (
					<Button isSecondary isSmall onClick={() => setIsEditing(true)}>
						{__('Edit', 'newspack-plugin')}
					</Button>
				) : (
					<div className="newspack-dashboard__section-header-actions">
						<Button isTertiary isSmall onClick={handleReset}>
							{__('Reset to default', 'newspack-plugin')}
						</Button>
						<Button isSecondary isSmall onClick={handleCancel}>
							{__('Cancel', 'newspack-plugin')}
						</Button>
						<Button isPrimary isSmall onClick={handleSave}>
							{__('Save', 'newspack-plugin')}
						</Button>
					</div>
				)}
			</div>
			<Grid style={ { '--np-dash-card-icon-size': '48px' } } columns={ 3 } gutter={ 24 }>
				{activeActions.map((action, i) =>
					isEditing ? (
						<div
							key={action.id}
							draggable
							onDragStart={(e) => handleDragStart(e, action, true)}
							onDragEnd={handleDragEnd}
							onDrop={(e) => handleDrop(e, i, true)}
							className={`newspack-dashboard__card-wrapper ${isDragging ? 'is-dragging' : ''} is-editing ${isDraggingInactive ? 'is-drop-target' : ''}`}
							style={getRandomDelay()}
						>
							<ActionCard action={action} />
						</div>
					) : (
						<a
							key={action.id}
							href={action.href}
							className="newspack-dashboard__card-wrapper"
						>
							<ActionCard action={action} />
						</a>
					)
				)}
				{isEditing && activeActions.length < MAX_ACTIVE_ACTIONS &&
					Array.from({ length: MAX_ACTIVE_ACTIONS - activeActions.length }).map((_, i) => (
						<div
							key={`placeholder-${i}`}
							onDrop={(e) => handleDrop(e, activeActions.length + i, true)}
							onDragOver={(e) => {
								e.preventDefault();
								if (isDraggingInactive) {
									e.currentTarget.classList.add('is-drop-target');
								}
							}}
							onDragLeave={(e) => e.currentTarget.classList.remove('is-drop-target')}
							className="newspack-dashboard__card-wrapper is-placeholder"
							style={getRandomDelay()}
						>
							<PlaceholderCard />
						</div>
					))
				}
			</Grid>
			{isEditing && (inactiveActions.length > 0 || isDraggingActive) && (
				<>
					<h4 className="newspack-dashboard__inactive-heading">
						{__('Available actions', 'newspack-plugin')}
					</h4>
					<Grid style={ { '--np-dash-card-icon-size': '48px' } } columns={ 3 } gutter={ 24 }>
						{inactiveActions.map((action, i) => (
							<div
								key={action.id}
								draggable
								onDragStart={(e) => handleDragStart(e, action, false)}
								onDragEnd={handleDragEnd}
								onDrop={(e) => handleDrop(e, i, false)}
								className={`newspack-dashboard__card-wrapper is-inactive ${isDragging ? 'is-dragging' : ''}`}
								style={getRandomDelay()}
							>
								<ActionCard action={action} />
							</div>
						))}
						{isDraggingActive && (
							<div
								className={`newspack-dashboard__remove-zone ${isDragOverRemove ? 'is-drag-over' : ''}`}
								onDrop={handleDrop}
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragOverRemove(true);
								}}
								onDragLeave={() => setIsDragOverRemove(false)}
								onDragEnd={() => setIsDragOverRemove(false)}
							>
								<RemoveZoneCard />
							</div>
						)}
					</Grid>
				</>
			)}
		</div>
	);
};

export default QuickActions;
