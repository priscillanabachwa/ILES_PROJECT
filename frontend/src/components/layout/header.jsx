function getInitials(user) {
	const first = user?.first_name?.[0] || ''
	const last = user?.last_name?.[0] || ''
	return `${first}${last}`.trim() || 'IL'
}

export default function Header({
	title = 'ILES Project',
	subtitle = 'Internship logging and evaluation system',
	user,
	onMenuToggle,
	actions = [],
}) {
	return (
		<header className="iles-header">
			<div className="iles-header__brand">
				<button
					type="button"
					className="iles-header__menu"
					onClick={onMenuToggle}
					aria-label="Toggle navigation menu"
				>
					<span />
					<span />
					<span />
				</button>

				<div className="iles-badge">IL</div>
				<div>
					<p className="iles-header__eyebrow">{title}</p>
					<p className="iles-header__title">{subtitle}</p>
				</div>
			</div>

			<div className="iles-header__actions">
				{actions.map((action) => (
					<a key={action.label} className="iles-header__action" href={action.href}>
						{action.label}
					</a>
				))}

				<div className="iles-header__user">
					<div className="iles-avatar">{getInitials(user)}</div>
					<div className="iles-header__user-meta">
						<span>{[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Guest user'}</span>
						<small>{user?.role || 'Project member'}</small>
					</div>
				</div>
			</div>
		</header>
	)
}
