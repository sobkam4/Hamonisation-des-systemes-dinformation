package com.ngtec.locationapp.data.mapper

import com.ngtec.locationapp.data.local.entity.ClientEntity
import com.ngtec.locationapp.data.remote.dto.ClientDto
import com.ngtec.locationapp.domain.model.Client

fun ClientDto.toEntity(): ClientEntity = ClientEntity(
    id = id,
    nomComplet = nomComplet.ifBlank { "$prenom $nom".trim() },
    telephone = telephone,
    email = email,
    adresse = adresse
)

fun ClientEntity.toDomain(): Client = Client(
    id = id,
    nomComplet = nomComplet,
    telephone = telephone,
    email = email,
    adresse = adresse
)
