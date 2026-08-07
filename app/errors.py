class CategoryAccessError(ValueError):
    """The requested category does not belong to the authenticated user."""


class DuplicateCategoryError(ValueError):
    """A category with the same name already exists for this user."""
