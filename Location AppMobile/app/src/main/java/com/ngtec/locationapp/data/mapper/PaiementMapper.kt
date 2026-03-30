package com.ngtec.locationapp.data.mapper

import com.ngtec.locationapp.data.local.entity.PaiementEntity
import com.ngtec.locationapp.data.remote.dto.PaiementDto
import com.ngtec.locationapp.domain.model.Paiement

fun PaiementDto.toEntity(): PaiementEntity = PaiementEntity(
    id = id,
    reference = reference ?: "Paiement #$id",
    contratReference = contratReference ?: contrat?.toString().orEmpty(),
    montant = montant,
    datePaiement = if (datePaiement.isNotBlank()) datePaiement else dateEcheance,
    statut = statutDisplay ?: statut,
    modePaiement = modePaiement
)

fun PaiementEntity.toDomain(): Paiement = Paiement(
    id = id,
    reference = reference,
    contratReference = contratReference,
    montant = montant,
    datePaiement = datePaiement,
    statut = statut,
    modePaiement = modePaiement
)
