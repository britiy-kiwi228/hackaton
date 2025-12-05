"""unique_index_join_requests

Revision ID: unique_index_join_requests
Revises: df6e06b32c92
Create Date: 2025-12-05 16:21:22.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'unique_index_join_requests'
down_revision = 'df6e06b32c92'
branch_labels = None
depends_on = None

def upgrade():
    # Create a unique index on (user_id, team_id, status) for pending requests
    op.create_unique_constraint(
        'uq_user_team_status',
        'join_requests',
        ['user_id', 'team_id', 'status']
    )

def downgrade():
    # Drop the unique index
    op.drop_constraint('uq_user_team_status', 'join_requests', type_='unique')
