package com.ngtec.locationapp.data.repository

import com.ngtec.locationapp.data.local.dao.PaiementDao
import com.ngtec.locationapp.data.mapper.toDomain
import com.ngtec.locationapp.data.mapper.toEntity
import com.ngtec.locationapp.data.remote.api.PaiementApiService
import com.ngtec.locationapp.data.remote.dto.PaiementCreateRequest
import com.ngtec.locationapp.domain.model.Paiement
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class PaiementRepository @Inject constructor(
    private val paiementApiService: PaiementApiService,
    private val paiementDao: PaiementDao
) {
    fun observePaiements(): Flow<List<Paiement>> = paiementDao.observeAll().map { items ->
        items.map { entity -> entity.toDomain() }
    }

    suspend fun refreshPaiements() {
        val remoteItems = paiementApiService.getPaiements()
        paiementDao.clearAll()
        paiementDao.insertAll(remoteItems.map { dto -> dto.toEntity() })
    }

    suspend fun createPaiement(
        contratId: Long,
        montant: Double,
        datePaiement: String,
        dateEcheance: String,
        montantDu: Double? = null,
        moisPaye: String? = null,
        statut: String,
        modePaiement: String,
        reference: String? = null
    ): Paiement {
        val created = paiementApiService.createPaiement(
            request = PaiementCreateRequest(
                contrat = contratId,
                reference = reference,
                dateEcheance = dateEcheance,
                montantDu = montantDu,
                moisPaye = moisPaye,
                montant = montant,
                datePaiement = datePaiement,
                statut = statut,
                modePaiement = modePaiement
            )
        )
        val entity = created.toEntity()
        paiementDao.insertAll(listOf(entity))
        return entity.toDomain()
    }

    suspend fun deletePaiement(id: Long) {
        paiementApiService.deletePaiement(id)
        paiementDao.deleteById(id)
    }
}
