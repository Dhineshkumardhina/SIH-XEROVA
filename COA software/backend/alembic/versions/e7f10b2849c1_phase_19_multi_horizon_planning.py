"""phase_19_multi_horizon_planning

Revision ID: e7f10b2849c1
Revises: d2ec699d6bc4
Create Date: 2026-08-30 20:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f10b2849c1'
down_revision: Union[str, None] = 'd2ec699d6bc4'
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    # Safely add columns to block_plans if they do not already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('block_plans')]

    with op.batch_alter_table('block_plans', schema=None) as batch_op:
        if 'published_by' not in existing_cols:
            batch_op.add_column(sa.Column('published_by', sa.String(length=64), nullable=True))
        if 'published_at' not in existing_cols:
            batch_op.add_column(sa.Column('published_at', sa.DateTime(), nullable=True))
        if 'version' not in existing_cols:
            batch_op.add_column(sa.Column('version', sa.Integer(), server_default='1', nullable=False))
        if 'change_reason' not in existing_cols:
            batch_op.add_column(sa.Column('change_reason', sa.String(length=255), nullable=True))
        if 'previous_version_id' not in existing_cols:
            batch_op.add_column(sa.Column('previous_version_id', sa.String(length=36), nullable=True))
            batch_op.create_foreign_key(
                'fk_block_plans_prev_version',
                'block_plans',
                ['previous_version_id'],
                ['id'],
                ondelete='SET NULL'
            )
        if 'weekly_plan_id' not in existing_cols:
            batch_op.add_column(sa.Column('weekly_plan_id', sa.String(length=64), nullable=True))
        if 'monthly_plan_id' not in existing_cols:
            batch_op.add_column(sa.Column('monthly_plan_id', sa.String(length=64), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('block_plans', schema=None) as batch_op:
        batch_op.drop_column('monthly_plan_id')
        batch_op.drop_column('weekly_plan_id')
        batch_op.drop_constraint('fk_block_plans_prev_version', type_='foreignkey')
        batch_op.drop_column('previous_version_id')
        batch_op.drop_column('change_reason')
        batch_op.drop_column('version')
        batch_op.drop_column('published_at')
        batch_op.drop_column('published_by')
