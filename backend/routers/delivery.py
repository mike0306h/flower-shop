"""
配送员管理
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import DeliveryPerson
from schemas import DeliveryPersonCreate, DeliveryPersonUpdate, DeliveryPersonResponse
from auth import get_current_admin

router = APIRouter()


@router.get("", response_model=List[dict])
def get_delivery_persons(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    persons = db.query(DeliveryPerson).order_by(DeliveryPerson.created_at.desc()).all()
    return [DeliveryPersonResponse.model_validate(p).model_dump() for p in persons]


@router.post("", response_model=dict)
def create_delivery_person(
    data: DeliveryPersonCreate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    person = DeliveryPerson(**data.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return DeliveryPersonResponse.model_validate(person).model_dump()


@router.put("/{person_id}", response_model=dict)
def update_delivery_person(
    person_id: int,
    data: DeliveryPersonUpdate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    person = db.query(DeliveryPerson).filter(DeliveryPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Delivery person not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(person, key, value)

    db.commit()
    db.refresh(person)
    return DeliveryPersonResponse.model_validate(person).model_dump()


@router.delete("/{person_id}")
def delete_delivery_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    person = db.query(DeliveryPerson).filter(DeliveryPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Delivery person not found")

    db.delete(person)
    db.commit()
    return {"success": True}
