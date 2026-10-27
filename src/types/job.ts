type JobStatus=
    "pending"|
    "applied"|
    "interview"|
    "technical_test"|
    "offer"|
    "rejected";


type workMode=
    "remote" |
    "hybrid" |
    "onsite";


type Job = {
    id: string;
    userId: string;
    company: string;
    position: string;
    status: JobStatus;

    jobUrl: string | null;

    salaryMin: number | null;
    salaryMax: number | null;
    currency: string | null;

    technologies: string[];

    location: string;
    workMode: workMode;

    appliedAt: string;

    notes:string | null;

    nextAction: string| null;
    nextActionAt: string| null;

    createdAt: string;
    updatedAt: string;
};

export type {JobStatus, workMode, Job};