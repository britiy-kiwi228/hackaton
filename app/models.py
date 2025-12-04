from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    BigInteger,
    Enum,
    ForeignKey,
    Table,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional
from app.database import Base


class Role(PyEnum):
    backend = "backend"
    frontend = "frontend"
    design = "design"
    pm = "pm"
    analyst = "analyst"


class RequestStatus(PyEnum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    canceled = "canceled"


class RequestType(PyEnum):
    join_team = "join_team"
    collaborate = "collaborate"


user_skills = Table(
    "user_skills",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)


user_participations = Table(
    "user_participations",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("participation_id", Integer, ForeignKey("hackathon_participations.id", ondelete="CASCADE"), primary_key=True),
)
class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_skills,
        back_populates="skills"
    )


class Hackathon(Base):
    __tablename__ = "hackathons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    start_date: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_date: Mapped[datetime] = mapped_column(DateTime, index=True)
    registration_deadline: Mapped[datetime] = mapped_column(DateTime, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    teams: Mapped[List["Team"]] = relationship(
        "Team",
        back_populates="hackathon"
    )


class HackathonParticipation(Base):
    __tablename__ = "hackathon_participations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    hackathon_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        index=True
    )
    place: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    team_name: Mapped[str] = mapped_column(String(255))
    project_link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    year: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text)

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_participations,
        back_populates="participations"
    )
    hackathon: Mapped["Hackathon"] = relationship("Hackathon")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )

    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)

    # добавлено: иконка-наклейка
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="achievements"
    )
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tg_id: Mapped[Optional[int]] = mapped_column(BigInteger, unique=True, index=True, nullable=True)

    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    bio: Mapped[str] = mapped_column(Text, default="")

    main_role: Mapped[Optional[Role]] = mapped_column(Enum(Role), nullable=True)
    ready_to_work: Mapped[bool] = mapped_column(Boolean, default=True)

    team_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("teams.id"),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # ---- ПОЛЯ ДЛЯ TELEGRAM AUTH ----
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tg_username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hide_tg_username: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # ---- ПОЛЯ ДЛЯ EMAIL/PASSWORD AUTH (АДМИНКА) ----
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    # --------------------------

    skills: Mapped[List["Skill"]] = relationship(
        "Skill",
        secondary=user_skills,
        back_populates="users"
    )

    achievements: Mapped[List["Achievement"]] = relationship(
        "Achievement",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    participations: Mapped[List["HackathonParticipation"]] = relationship(
        "HackathonParticipation",
        secondary=user_participations,
        back_populates="users"
    )

    team: Mapped[Optional["Team"]] = relationship(
        "Team",
        back_populates="members",
        foreign_keys="User.team_id"
    )


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")

    # Капитан команды
    captain_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )
    
    # Альтернативное название (для совместимости)
    leader_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True
    )

    hackathon_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("hackathons.id", ondelete="CASCADE")
    )
    
    # Команда ищет участников
    is_looking: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members: Mapped[List["User"]] = relationship(
        "User",
        back_populates="team",
        cascade="all",
        foreign_keys="[User.team_id]"
    )
    
    captain: Mapped["User"] = relationship(
        "User",
        foreign_keys=[captain_id],
        lazy="joined"
    )

    hackathon: Mapped["Hackathon"] = relationship(
        "Hackathon",
        back_populates="teams"
    )

    requests: Mapped[List["JoinRequest"]] = relationship(
        "JoinRequest",
        back_populates="team",
        cascade="all, delete-orphan"
    )


class Request(Base):
    __tablename__ = "requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    sender_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )
    receiver_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True
    )
    team_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=True
    )
    hackathon_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("hackathons.id", ondelete="CASCADE")
    )

    request_type: Mapped[RequestType] = mapped_column(
        Enum(RequestType)
    )
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus),
        default=RequestStatus.pending
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])
    receiver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[receiver_id])
    team: Mapped[Optional["Team"]] = relationship("Team")
    hackathon: Mapped["Hackathon"] = relationship("Hackathon")


class JoinRequest(Base):
    __tablename__ = "join_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    team_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("teams.id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )

    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus),
        default=RequestStatus.pending
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped["Team"] = relationship(
        "Team",
        back_populates="requests"
    )
    user: Mapped["User"] = relationship("User")
