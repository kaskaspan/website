export interface AccommodationSetting {
  oneHandMode?: "left" | "right";
  extendedTime?: number;
  audioGuidance?: boolean;
  highContrast?: boolean;
}

export interface ClassroomSetting {
  allowStudentCreation: boolean;
  defaultDueDays?: number;
  visibility: "private" | "organization" | "public";
}

export interface ClassroomMember {
  userId: string;
  role: "student" | "co-teacher";
  status: "active" | "inactive";
  accommodations?: AccommodationSetting;
}

export interface Classroom {
  id: string;
  name: string;
  ownerId: string;
  organizationId?: string;
  gradeLevel?: string;
  tags?: string[];
  roster: ClassroomMember[];
  settings: ClassroomSetting;
}

export interface ClassroomAssignment {
  id: string;
  classroomId: string;
  lessonIds: string[];
  assignedAt: string;
  dueAt?: string;
  timeLimitMin?: number;
  prerequisites?: string[];
  targetGroupIds?: string[];
}

