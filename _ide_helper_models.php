<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @property int $id
 * @property int $candidate_id
 * @property int $user_id
 * @property string $action
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Candidate $candidate
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog whereAction($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog whereCandidateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ActivityLog whereUserId($value)
 */
	class ActivityLog extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string|null $nik
 * @property int $joblevel_id
 * @property int $department_id
 * @property string $birthplace
 * @property \Illuminate\Support\Carbon $birthdate
 * @property \Illuminate\Support\Carbon $first_working_day
 * @property string|null $image_path
 * @property bool $is_printed
 * @property int|null $photo_number
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ActivityLog> $activityLogs
 * @property-read int|null $activity_logs_count
 * @property-read \App\Models\Department $department
 * @property-read \App\Models\Joblevel $joblevel
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereBirthdate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereBirthplace($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereDepartmentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereFirstWorkingDay($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereImagePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereIsPrinted($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereJoblevelId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereNik($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate wherePhotoNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Candidate whereUpdatedAt($value)
 */
	class Candidate extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property bool $ctpat
 * @property string|null $description
 * @property string $template_path
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Department> $departments
 * @property-read int|null $departments_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Joblevel> $joblevels
 * @property-read int|null $joblevels_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate whereCtpat($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate whereTemplatePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CardTemplate whereUpdatedAt($value)
 */
	class CardTemplate extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Candidate> $candidates
 * @property-read int|null $candidates_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\CardTemplate> $cardTemplates
 * @property-read int|null $card_templates_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Department newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Department newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Department query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Department whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Department whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Department whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Department whereUpdatedAt($value)
 */
	class Department extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Candidate> $candidates
 * @property-read int|null $candidates_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\CardTemplate> $cardTemplates
 * @property-read int|null $card_templates_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Joblevel newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Joblevel newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Joblevel query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Joblevel whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Joblevel whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Joblevel whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Joblevel whereUpdatedAt($value)
 */
	class Joblevel extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ActivityLog> $activityLogs
 * @property-read int|null $activity_logs_count
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 */
	class User extends \Eloquent {}
}

