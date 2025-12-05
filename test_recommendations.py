import pytest
from fastapi import status
from app.models import User, Skill, Recommendation

def test_get_recommendations(auth_client, db_session, user_factory):
    # Create current user with skills
    current_user = user_factory(
        username="current_user",
        email="current@example.com",
        full_name="Current User"
    )
    skill1 = Skill(name="Python")
    skill2 = Skill(name="FastAPI")
    current_user.skills.extend([skill1, skill2])
    db_session.add_all([skill1, skill2])
    db_session.commit()

    # Create other users with overlapping and non-overlapping skills
    user1 = user_factory(
        username="user1",
        email="user1@example.com",
        full_name="User One"
    )
    user1.skills.append(skill1)  # Overlapping skill
    db_session.add(user1)

    user2 = user_factory(
        username="user2",
        email="user2@example.com",
        full_name="User Two"
    )
    user2.skills.append(Skill(name="Django"))  # Non-overlapping skill
    db_session.add(user2)

    db_session.commit()

    # Create recommendations
    recommendation1 = Recommendation(user_id=current_user.id, recommended_user_id=user1.id)
    recommendation2 = Recommendation(user_id=current_user.id, recommended_user_id=user2.id)
    db_session.add_all([recommendation1, recommendation2])
    db_session.commit()

    # Make request to recommendations endpoint
    response = auth_client.get("/recommendations/users")

    # Assert response status
    assert response.status_code == status.HTTP_200_OK

    # Assert response structure
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2  # Both user1 and user2 should be in recommendations

    # Assert current user is not in recommendations
    recommended_user_ids = [user["id"] for user in data]
    assert current_user.id not in recommended_user_ids

    # Assert user1 is in recommendations
    assert user1.id in recommended_user_ids

    # Assert user2 is in recommendations
    assert user2.id in recommended_user_ids
    # Create current user with skills
    current_user = user_factory(
        username="current_user",
        email="current@example.com",
        full_name="Current User"
    )
    skill1 = Skill(name="Python")
    skill2 = Skill(name="FastAPI")
    current_user.skills.extend([skill1, skill2])
    db_session.add_all([skill1, skill2])
    db_session.commit()

    # Create other users with overlapping and non-overlapping skills
    user1 = user_factory(
        username="user1",
        email="user1@example.com",
        full_name="User One"
    )
    user1.skills.append(skill1)  # Overlapping skill
    db_session.add(user1)

    user2 = user_factory(
        username="user2",
        email="user2@example.com",
        full_name="User Two"
    )
    user2.skills.append(Skill(name="Django"))  # Non-overlapping skill
    db_session.add(user2)

    db_session.commit()

    # Make request to recommendations endpoint
    response = auth_client.get("/recommendations/users")

    # Assert response status
    assert response.status_code == status.HTTP_200_OK

    # Assert response structure
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1  # Only user1 should be in recommendations

    # Assert current user is not in recommendations
    recommended_user_ids = [user["id"] for user in data]
    assert current_user.id not in recommended_user_ids

    # Assert user1 is in recommendations
    assert user1.id in recommended_user_ids

    # Assert user2 is not in recommendations
    assert user2.id not in recommended_user_ids
