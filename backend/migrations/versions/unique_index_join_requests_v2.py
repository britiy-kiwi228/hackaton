"""unique_index_join_requests_v2

Revision ID: unique_index_join_requests_v2
Revises: unique_index_join_requests
Create Date: 2025-12-05 16:47:01.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'unique_index_join_requests_v2'
down_revision = 'unique_index_join_requests'
branch_labels = None
depends_on = None

def upgrade():
    # Create a new table with the unique constraint
    op.create_table(
        'join_requests_new',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('team_id', sa.Integer, nullable=False),
        sa.Column('status', sa.String, nullable=False),
        sa.UniqueConstraint('user_id', 'team_id', 'status', name='uq_user_team_status')
    )

    # Copy data from the old table to the new table
    op.execute('''
        INSERT INTO join_requests_new (id, user_id, team_id, status)
        SELECT id, user_id, team_id, status FROM join_requests
    ''')

    # Drop the old table
    op.drop_table('join_requests')

    # Rename the new table to the old table name
    op.rename_table('join_requests_new', 'join_requests')

def downgrade():
    # Create a new table without the unique constraint
    op.create_table(
        'join_requests_new',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('team_id', sa.Integer, nullable=False),
        sa.Column('status', sa.String, nullable=False)
    )

    # Copy data from the old table to the new table
    op.execute('''
        INSERT INTO join_requests_new (id, user_id, team_id, status)
        SELECT id, user_id, team_id, status FROM join_requests
    ''')

    # Drop the old table
    op.drop_table('join_requests')

    # Rename the new table to the old table name
    op.rename_table('join_requests_new', 'join_requests')
