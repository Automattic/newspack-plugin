type Action = {
	label: string;
	statusLabels?: { pending?: string; error?: string; success?: string };
	canConnect?: boolean;
	endpoint: string;
	then: ( args: any ) => boolean;
};

type Actions = {
	[ k: string ]: Action;
};

type PrerequisitesStatus = {
	prerequisite_status: {
		[ k: string ]: {
			active: boolean;
		};
	};
};

type Statuses = 'success' | 'error' | 'pending' | 'idle';