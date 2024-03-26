type Dependencies = Record< string, { isActive: boolean; label: string } >;

type Action = {
	label: string;
	statusLabels?: { pending?: string; error?: string; success?: string };
	canConnect?: boolean;
	endpoint: string;
	dependencies?: Dependencies;
	then: ( args: any ) => boolean;
};

type Actions = {
	[ k: string ]: Action;
};

type ActionLocal = {
	dependencies: Dependencies;
};

type SiteStatus = {
	label: string;
	canConnect?: boolean;
	statusLabels?: { [ k in Statuses ]?: string };
	endpoint: string;
	dependencies?: Dependencies | null;
	then: ( args?: any ) => boolean;
};

type SiteActionModal = {
	onRequestClose: ( a: boolean ) => void;
	onSuccess: ( a: Record<string, any> ) => void;
	plugins: string[];
};

type PrerequisitesStatus = {
	prerequisite_status: {
		[ k: string ]: {
			active: boolean;
		};
	};
};

type Statuses = 'success' | 'error' | 'error-dependency' | 'pending' | 'pending-install' | 'idle';
